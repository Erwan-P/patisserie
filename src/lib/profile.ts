import type { Prisma } from "@prisma/client";

export const profileSelect = {
  id: true, name: true, email: true, role: true,
  orders: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, total: true, createdAt: true, pickupDate: true,
      items: { select: {
        id: true, quantity: true, price: true,
        product: { select: { name: true, imageUrl: true } },
      } },
    },
  },
} satisfies Prisma.UserSelect;

export type ProfileData = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
