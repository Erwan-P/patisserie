"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/lib/store";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground relative z-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Logo */}
        <div className="flex-1 md:flex-none text-center md:text-left flex items-center gap-3">
          <Image 
            src="/images/logo.jpg" 
            alt="La Maison Sucrée Logo" 
            width={64} 
            height={64} 
            className="mix-blend-multiply rounded-full"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-12 uppercase tracking-widest text-[11px] font-bold">
          <Link href="/" className="group relative">
            Accueil
            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300"></span>
          </Link>
          <Link href="/catalogue" className="group relative">
            La Carte
            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300"></span>
          </Link>
          <Link href="/notre-histoire" className="group relative">
            Notre Histoire
            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300"></span>
          </Link>
          <Link href="/contact" className="group relative">
            Contact
            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300"></span>
          </Link>
        </nav>

      {/* Icons */}
        <div className="flex items-center space-x-4">
          
          <div className="relative group p-2">
            {status === "loading" ? (
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            ) : status === "authenticated" ? (
              <>
                <Link href="/profil" className="hover:text-primary transition-colors flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                </Link>
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden hidden md:block">
                  <div className="py-2 flex flex-col text-sm font-medium">
                    <Link href="/profil" className="px-4 py-2 hover:bg-muted transition-colors">
                      Mon Profil
                    </Link>
                    <Link href="/profil#commandes" className="px-4 py-2 hover:bg-muted transition-colors">
                      Mes Commandes
                    </Link>
                    {session?.user?.role === "ADMIN" && (
                      <Link href="/admin" className="px-4 py-2 hover:bg-muted transition-colors text-primary">
                        Administration
                      </Link>
                    )}
                    <div className="h-px bg-border my-1"></div>
                    <button 
                      onClick={() => {
                        useCartStore.getState().clearCart();
                        signOut({ callbackUrl: '/' });
                      }}
                      className="px-4 py-2 hover:bg-red-50 text-red-600 text-left transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link href="/auth/signin" className="hover:text-primary transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          <Link href="/panier" className="p-2 hover:text-primary transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-border bg-background overflow-hidden absolute w-full left-0 top-20 shadow-xl"
          >
            <div className="py-6 px-6 space-y-6 flex flex-col">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif">Accueil</Link>
              <Link href="/catalogue" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif">La Carte</Link>
              <Link href="/notre-histoire" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif">Notre Histoire</Link>
              <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif">Contact</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
