"use server";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function verifyAdmin2FA(pin: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN" || !session.user.email) {
    return { error: "Non autorisé." };
  }

  const identifier = session.user.email;
  
  let rateLimit = await prisma.rateLimit.findUnique({ where: { identifier } });
  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({ data: { identifier, attempts: 0 } });
  }

  const now = new Date().getTime();

  // 1. Vérification du blocage de 30 minutes
  if (rateLimit.lockedAt) {
    const lockedTime = rateLimit.lockedAt.getTime();
    const timePassed = now - lockedTime;
    if (timePassed < 30 * 60 * 1000) {
      const minutesLeft = Math.ceil((30 * 60 * 1000 - timePassed) / 60000);
      return { error: `Trop de tentatives. Réessayez dans ${minutesLeft} minutes.` };
    } else {
      // Déblocage automatique après 30 min
      await prisma.rateLimit.update({
        where: { identifier },
        data: { attempts: 0, lockedAt: null }
      });
      rateLimit.attempts = 0;
    }
  }
  
  // 2. Vérification du cooldown de 30 secondes entre chaque essai
  if (rateLimit.attempts > 0) {
    const timeSinceLastAttempt = now - rateLimit.updatedAt.getTime();
    if (timeSinceLastAttempt < 30000) {
      const secondsLeft = Math.ceil((30000 - timeSinceLastAttempt) / 1000);
      return { error: `Veuillez patienter ${secondsLeft} secondes.` };
    }
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } });
  if (!user?.twoFactorHash) return { error: "Erreur de configuration 2FA." };

  const isValid = await bcrypt.compare(pin, user.twoFactorHash);
  
  if (!isValid) {
    const newAttempts = rateLimit.attempts + 1;
    await prisma.rateLimit.update({
      where: { identifier },
      data: {
        attempts: newAttempts,
        lockedAt: newAttempts >= 5 ? new Date() : null
      }
    });
    
    if (newAttempts >= 5) {
      return { error: "Trop de tentatives. Bloqué pour 30 minutes." };
    }
    return { error: `Code incorrect. (Essais restants : ${5 - newAttempts})` };
  }

  // Succès : Reset rate limit et création du cookie de session
  await prisma.rateLimit.update({
    where: { identifier },
    data: { attempts: 0, lockedAt: null }
  });

  const cookieStore = await cookies();
  cookieStore.set("admin_2fa_verified", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Pas de maxAge -> Cookie de session stricte, supprimé à la fermeture du navigateur
  });

  return { success: true };
}

export async function clearAdmin2FA() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_2fa_verified");
}
