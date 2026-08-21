"use client";

import { useRouter } from "next/navigation";

export function PeriodFilter({ period, sortBy, sortOrder }: { period: string, sortBy: string, sortOrder: string }) {
  const router = useRouter();

  return (
    <form>
      <input type="hidden" name="sort" value={sortBy} />
      <input type="hidden" name="order" value={sortOrder} />
      <select 
        name="period" 
        defaultValue={period}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("period", e.target.value);
          url.searchParams.set("sort", sortBy);
          url.searchParams.set("order", sortOrder);
          router.push(url.pathname + url.search);
        }}
        className="px-4 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-semibold cursor-pointer"
      >
        <option value="all">Toutes périodes</option>
        <option value="day">Aujourd'hui</option>
        <option value="week">7 derniers jours</option>
        <option value="month">30 derniers jours</option>
        <option value="year">12 derniers mois</option>
      </select>
    </form>
  );
}

export function SortFilter({ period, sortBy, sortOrder }: { period: string, sortBy: string, sortOrder: string }) {
  const router = useRouter();

  const handleSortChange = (name: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("period", period);
    if (name === "sort") url.searchParams.set("sort", value);
    if (name === "order") url.searchParams.set("order", value);
    router.push(url.pathname + url.search);
  };

  return (
    <form className="flex items-center gap-2">
      <input type="hidden" name="period" value={period} />
      <select 
        name="sort" 
        defaultValue={sortBy}
        onChange={(e) => handleSortChange("sort", e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1 bg-muted/20"
      >
        <option value="sales">Par Ventes</option>
        <option value="views">Par Vues</option>
      </select>
      <select 
        name="order" 
        defaultValue={sortOrder}
        onChange={(e) => handleSortChange("order", e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1 bg-muted/20"
      >
        <option value="desc">Décroissant</option>
        <option value="asc">Croissant</option>
      </select>
    </form>
  );
}
