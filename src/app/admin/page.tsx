import { ShoppingBag, TrendingUp, Users, PackageOpen, ArrowUp, ArrowDown } from "lucide-react";
import { getDashboardStats, getPopularProducts, PeriodFilter as PeriodFilterType } from "@/actions/dashboard";
import Link from "next/link";
import Image from "next/image";
import { PeriodFilter, SortFilter } from "@/components/admin/DashboardFilters";

import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const adminName = session?.user?.name || "Administrateur";
  
  const params = await searchParams;
  const period = (params.period as PeriodFilterType) || "all";
  const sortBy = (params.sort as "sales" | "views") || "sales";
  const sortOrder = (params.order as "asc" | "desc") || "desc";

  const statsData = await getDashboardStats(period);
  const popularProducts = await getPopularProducts(sortBy, sortOrder);
  
  // Fetch recent pending or paid orders
  const recentOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "PAID", "PREPARING"] }
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { user: { select: { name: true, email: true } } }
  });

  const stats = [
    { label: "Total vente en ligne", value: `${statsData.totalSales.toFixed(2)} €`, icon: TrendingUp },
    { label: "Commandes (Total)", value: statsData.ordersCount.toString(), icon: ShoppingBag },
    { label: "Comptes Clients", value: statsData.customerCount.toString(), subText: `Total : ${statsData.totalCustomers}`, icon: Users },
    { label: "Produits en rupture", value: statsData.outOfStock.toString(), icon: PackageOpen, trendColor: statsData.outOfStock > 0 ? "text-destructive" : "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">Bienvenue dans votre espace de gestion, {adminName}.</p>
        </div>
        
        <PeriodFilter period={period} sortBy={sortBy} sortOrder={sortOrder} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-background p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                {stat.trendColor && (
                  <span className={`text-xs font-bold ${stat.trendColor}`}>
                    {stat.value === "0" ? "Tout est OK" : "À vérifier"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  {stat.subText && <span className="text-xs font-medium text-muted-foreground">{stat.subText}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 bg-background rounded-2xl border border-border p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Commandes à préparer</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">
              Voir tout
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
              <p>Aucune commande en attente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {order.total.toFixed(2)} €
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{order.user.name || order.user.email}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: fr })}</p>
                  </div>
                  <OrderStatusSelect id={order.id} currentStatus={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Produits Populaires</h2>
            <SortFilter period={period} sortBy={sortBy} sortOrder={sortOrder} />
          </div>
          
          <div className="space-y-4">
            {popularProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-2 hover:bg-muted/30 rounded-xl transition-colors">
                {product.imageUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-border/50 bg-muted">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.price.toFixed(2)} €</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary text-sm">{sortBy === "sales" ? product.sales : product.views} {sortBy === "sales" ? "ventes" : "vues"}</p>
                </div>
              </div>
            ))}
            {popularProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun produit.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
