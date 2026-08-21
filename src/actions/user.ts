"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(name: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return { error: "Non autorisé." };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
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
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      // Manual cascade since schema doesn't have onDelete: Cascade for Orders
      await prisma.$transaction([
        prisma.order.deleteMany({ where: { userId: user.id } }),
        prisma.account.deleteMany({ where: { userId: user.id } }),
        prisma.session.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } })
      ]);
    }
    // NextAuth will handle the session cookie deletion on client side after calling signOut
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Erreur lors de la suppression du compte." };
  }
}
