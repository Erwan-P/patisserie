"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/products", label: "Produits", icon: Package },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  // Cacher la sidebar sur la page 2FA
  if (pathname === "/admin/2fa") return null;

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-screen sticky top-0">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <Link href="/" className="font-serif text-xl font-bold hover:text-primary transition-colors">
          La Maison Sucrée
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/admin");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={async () => {
            const { logoutAdmin } = await import("@/actions/auth");
            await logoutAdmin();
            signOut({ callbackUrl: "/" });
          }}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
