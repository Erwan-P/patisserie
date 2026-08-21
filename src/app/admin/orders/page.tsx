import { prisma } from "@/lib/prisma";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrderFilterSelect from "@/components/admin/OrderFilterSelect";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as string;

  const whereClause = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {};

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      items: {
        include: { product: { select: { name: true } } }
      }
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Commandes</h1>
          <p className="text-muted-foreground mt-2">Gérez les commandes et leurs statuts.</p>
        </div>

        <form method="GET">
          <OrderFilterSelect defaultValue={statusFilter || "ALL"} />
        </form>
      </div>

      <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">N° Commande</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Articles</th>
              <th className="px-6 py-4 font-bold text-foreground">Total</th>
              <th className="px-6 py-4 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground">
                    {order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground mb-1">
                      Passée le {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </div>
                    {order.pickupDate && (
                      <div className="font-bold text-primary flex items-center gap-1 text-sm">
                        Retrait: {format(new Date(order.pickupDate), "dd MMM à HH:mm", { locale: fr })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.user.name || "Client Anonyme"}</div>
                    <div className="text-xs text-muted-foreground">{order.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    <ul className="list-disc list-inside">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}x {item.product.name}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {order.total.toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 text-right">
                    <OrderStatusSelect id={order.id} currentStatus={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
