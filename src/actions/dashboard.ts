"use server";

import { prisma } from "@/lib/prisma";
import { getVerifiedAdminSession } from "@/lib/admin-auth";
import { subDays, subMonths, subYears, startOfDay } from "date-fns";

export type PeriodFilter = "day" | "week" | "month" | "year" | "all";

export async function getDashboardStats(period: PeriodFilter = "all") {
  const session = await getVerifiedAdminSession();
  
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Non autorisé");
  }

  const now = new Date();
  let startDate: Date | undefined;

  if (period === "day") startDate = startOfDay(now);
  else if (period === "week") startDate = subDays(now, 7);
  else if (period === "month") startDate = subMonths(now, 1);
  else if (period === "year") startDate = subYears(now, 1);

  const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

  // Ventes (Sales = sum of Order totals where status != CANCELLED)
  const orders = await prisma.order.findMany({
    where: {
      ...dateFilter,
      status: { not: "CANCELLED" }
    },
    select: { total: true }
  });
  
  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);

  // Comptes clients sur la période
  const customerCount = await prisma.user.count({
    where: {
      role: "USER",
      ...dateFilter
    }
  });

  // Total des comptes clients
  const totalCustomers = await prisma.user.count({
    where: {
      role: "USER"
    }
  });

  // Commandes (count)
  const ordersCount = orders.length;

  // Produits en rupture
  const outOfStock = await prisma.product.count({
    where: { inventory: { lte: 0 } }
  });

  return {
    totalSales,
    customerCount,
    totalCustomers,
    ordersCount,
    outOfStock
  };
}

export async function getPopularProducts(sortBy: "sales" | "views" = "sales", order: "asc" | "desc" = "desc") {
  const session = await getVerifiedAdminSession();
  if (!session) {
    throw new Error("Non autorisé");
  }

  const products = await prisma.product.findMany({
    orderBy: {
      [sortBy]: order
    },
    select: {
      id: true,
      name: true,
      price: true,
      sales: true,
      views: true,
      inventory: true,
      imageUrl: true,
    }
  });
  return products;
}
