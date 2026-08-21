"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer({ settings }: { settings?: any }) {
  const pathname = usePathname();

  // Do not show footer on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Fallback values if settings not loaded yet
  const phone = settings?.phone || "+33 1 23 45 67 89";
  const email = settings?.email || "contact@lamaisonsucree.fr";
  const address = settings?.address || "15 Place Vendôme, 75001 Paris, France";

  return (
    <footer className="bg-[#1A1A1A] text-[#FDFBF7] py-8 border-t border-[#1A1A1A]/10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
          <div className="text-center md:text-left space-y-4">
            <h3 className="font-serif text-3xl md:text-4xl">La Maison Sucrée</h3>
            <p className="text-background/80 max-w-sm text-sm">L'artisanat français au service de la gourmandise. Des créations uniques pour des moments inoubliables.</p>
          </div>
          <div className="text-center md:text-right space-y-2 text-sm text-background/80">
            <p className="font-bold text-background uppercase tracking-widest text-xs mb-4">Contact</p>
            <p><a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a></p>
            <p><a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-primary transition-colors">{phone}</a></p>
            <p>{address}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-background/10">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs md:text-sm uppercase tracking-widest font-semibold text-background/80">
            <Link href="/legal#cgv" className="hover:text-primary transition-colors">CGV</Link>
            <Link href="/legal#mentions-legales" className="hover:text-primary transition-colors">Mentions Légales</Link>
            <Link href="/legal#politique-confidentialite" className="hover:text-primary transition-colors">Politique de Confidentialité</Link>
            <Link href="/legal#cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
          <p className="text-background/40 text-[10px] md:text-xs">© {new Date().getFullYear()} Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
