"use client";

export default function OrderFilterSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="status"
      defaultValue={defaultValue}
      onChange={(e) => e.target.form?.submit()}
      className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold cursor-pointer"
    >
      <option value="ALL">Tous les statuts</option>
      <option value="PENDING">En attente</option>
      <option value="PAID">Payées</option>
      <option value="PREPARING">En préparation</option>
      <option value="READY">Prêtes</option>
      <option value="COMPLETED">Terminées</option>
      <option value="CANCELLED">Annulées</option>
    </select>
  );
}
