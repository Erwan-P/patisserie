"use server";

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { admin2FACookie, createAdmin2FAToken } from "@/lib/admin-2fa";
import { credentialVersion } from "@/lib/security";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function verifyAdmin2FA(pin: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return { error: "Non autorisé." };
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) return { error: "Le code doit contenir 6 chiffres." };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, password: true, twoFactorHash: true },
  });
  if (!user || user.role !== "ADMIN" || !user.twoFactorHash ||
      credentialVersion(user) !== session.user.securityVersion) return { error: "Non autorisé." };
  if (!await consumeRateLimit("pin", user.id, { limit: 5, windowMs: 30 * 60 * 1000, cooldownMs: 30000 })) {
    return { error: "Veuillez patienter avant de réessayer. Après 5 tentatives, attendez 30 minutes." };
  }
  if (!await bcrypt.compare(pin, user.twoFactorHash)) return { error: "Code incorrect." };
  const cookieStore = await cookies();
  const token = await createAdmin2FAToken(user.id, `${session.user.securityVersion}:${session.user.sessionId}`);
  cookieStore.set(admin2FACookie.name, token, admin2FACookie.options);
  return { success: true };
}

export async function clearAdmin2FA() {
  (await cookies()).delete(admin2FACookie.name);
}
