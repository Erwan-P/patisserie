"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { boundedText } from "@/lib/security";

export async function updateProfile(name: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return { error: "Non autorisé." };
  }

  try {
    const safeName = boundedText(name, "Nom", 100);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: safeName },
    });
    
    revalidatePath("/profil");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Erreur lors de la mise à jour du profil." };
  }
}

export async function deleteAccount() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return { error: "Non autorisé." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, email: true } });
      if (!user) return;
      if (user.role === "ADMIN") throw new Error("La suppression du compte administrateur est interdite.");
      await tx.order.deleteMany({ where: { userId: user.id } });
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      if (user.email) await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
      await tx.user.delete({ where: { id: user.id } });
    }, { isolationLevel: "Serializable" });
    // NextAuth will handle the session cookie deletion on client side after calling signOut
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Erreur lors de la suppression du compte." };
  }
}
