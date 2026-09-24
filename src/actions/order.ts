"use server";

import { prisma } from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export async function updateOrderStatus(id: string, status: string) {
  const session = await getVerifiedAdminSession();
  
  if (!session || session.user?.role !== "ADMIN") {
    return { error: "Non autorisé." };
  }

  const validStatuses = ["PENDING", "PAID", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "Statut invalide." };
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return { success: true, order };
  } catch (error) {
    console.error("Update order status error:", error);
    return { error: "Erreur lors de la mise à jour de la commande." };
  }
}
