import { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  id: string;
  quantity: number;
  price: number;
};

function parseMetadata(session: Stripe.Checkout.Session) {
  const { userId, pickupDate, pickupTime, cartItems } = session.metadata ?? {};
  if (!userId || !pickupDate || !pickupTime || !cartItems) {
    throw new Error("Métadonnées de paiement incomplètes.");
  }

  const rawItems: unknown = JSON.parse(cartItems);
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 25) {
    throw new Error("Panier de paiement invalide.");
  }

  const items = rawItems.map((item): CheckoutItem => {
    if (
      typeof item !== "object" || item === null ||
      typeof (item as CheckoutItem).id !== "string" ||
      !Number.isInteger((item as CheckoutItem).quantity) ||
      (item as CheckoutItem).quantity < 1 ||
      (item as CheckoutItem).quantity > 50 ||
      typeof (item as CheckoutItem).price !== "number" ||
      !Number.isFinite((item as CheckoutItem).price) ||
      (item as CheckoutItem).price < 0
    ) {
      throw new Error("Article de paiement invalide.");
    }
    return item as CheckoutItem;
  });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
    throw new Error("Créneau de retrait invalide.");
  }

  const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00Z`);
  if (Number.isNaN(pickupDateTime.getTime())) {
    throw new Error("Date de retrait invalide.");
  }

  return { userId, pickupDate, pickupTime, pickupDateTime, items };
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    throw new Error("Le paiement n'est pas confirmé.");
  }

  const metadata = parseMetadata(session);
  const total = (session.amount_total ?? 0) / 100;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingOrder = await tx.order.findUnique({
          where: { id: session.id },
          include: { items: { include: { product: true } }, user: true },
        });
        if (existingOrder) return { order: existingOrder, created: false, ...metadata };

        for (const item of metadata.items) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.id,
              isAvailable: true,
              inventory: { gte: item.quantity },
            },
            data: {
              inventory: { decrement: item.quantity },
              sales: { increment: item.quantity },
            },
          });
          if (updated.count !== 1) {
            throw new Error("Stock devenu insuffisant pour finaliser la commande.");
          }
        }

        const order = await tx.order.create({
          data: {
            id: session.id,
            userId: metadata.userId,
            status: "PAID",
            total,
            pickupDate: metadata.pickupDateTime,
            items: {
              create: metadata.items.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: { include: { product: true } }, user: true },
        });

        return { order, created: true, ...metadata };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) {
        continue;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const order = await prisma.order.findUnique({
          where: { id: session.id },
          include: { items: { include: { product: true } }, user: true },
        });
        if (order) return { order, created: false, ...metadata };
      }
      throw error;
    }
  }

  throw new Error("Impossible de finaliser la commande après plusieurs tentatives.");
}
