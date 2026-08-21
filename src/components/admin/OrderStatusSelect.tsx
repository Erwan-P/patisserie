"use client";

import { updateOrderStatus } from "@/actions/order";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-600 border-yellow-200",
  PAID: "bg-blue-50 text-blue-600 border-blue-200",
  PREPARING: "bg-purple-50 text-purple-600 border-purple-200",
  READY: "bg-emerald-50 text-emerald-600 border-emerald-200",
  COMPLETED: "bg-slate-50 text-slate-600 border-slate-200",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function OrderStatusSelect({ id, currentStatus }: { id: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    
    const res = await updateOrderStatus(id, newStatus);
    
    if (res.error) {
      alert(res.error);
    } else {
      router.refresh();
    }
    
    setLoading(false);
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        disabled={loading}
        value={currentStatus}
        onChange={handleChange}
        className={`appearance-none pr-8 pl-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-colors ${STATUS_COLORS[currentStatus]}`}
      >
        <option value="PENDING">En attente</option>
        <option value="PAID">Payée</option>
        <option value="PREPARING">En préparation</option>
        <option value="READY">Prête</option>
        <option value="COMPLETED">Terminée</option>
        <option value="CANCELLED">Annulée</option>
      </select>
      {loading && (
        <div className="absolute right-2 pointer-events-none">
          <Loader2 className="w-3 h-3 animate-spin text-current opacity-50" />
        </div>
      )}
    </div>
  );
}
