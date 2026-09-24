"use client";

import { useCartStore } from "@/lib/store";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Minus, Calendar, Clock, CreditCard } from "lucide-react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@prisma/client";

export default function PanierClient({ settings, placeholderUrl }: { settings: StoreSettings | null; placeholderUrl: string }) {
  const { items, updateQuantity, removeItem, pickupDate, pickupTime, setPickupSlot } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const router = useRouter();

  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const getDaySchedule = (date: Date) => {
    if (settings?.isVacationMode) return "Fermé";
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const days = [
      settings?.hoursSunday,
      settings?.hoursMonday,
      settings?.hoursTuesday,
      settings?.hoursWednesday,
      settings?.hoursThursday,
      settings?.hoursFriday,
      settings?.hoursSaturday,
    ];
    return days[dayIndex] || "Fermé";
  };

  // Generate next 14 days for date selection, excluding closed days
  const today = startOfToday();
  const availableDates = Array.from({ length: 14 })
    .map((_, i) => addDays(today, i + 1))
    .filter(date => getDaySchedule(date) !== "Fermé" && getDaySchedule(date) !== "");

  const generateTimeSlots = (dateString: string | null) => {
    if (!dateString) return [];
    // Parsing manuel pour éviter tout décalage UTC (YYYY-MM-DD)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const scheduleStr = getDaySchedule(date);
    if (scheduleStr === "Fermé" || !scheduleStr) return [];

    const slots = scheduleStr.replace(/\s+/g, '').split(',');
    let generatedSlots: string[] = [];
    
    slots.forEach(slot => {
      const [openStr, closeStr] = slot.split('-');
      if (!openStr || !closeStr) return;
      
      const [openH, openM] = openStr.split(':').map(Number);
      const [closeH, closeM] = closeStr.split(':').map(Number);
      
      let current = new Date(date);
      current.setHours(openH, openM, 0, 0);
      
      const end = new Date(date);
      end.setHours(closeH, closeM, 0, 0);
      
      const minimumTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      while (current <= end) {
        if (current >= minimumTime) {
          generatedSlots.push(format(current, "HH:mm"));
        }
        current.setMinutes(current.getMinutes() + 30);
      }
    });

    return generatedSlots;
  };

  const dynamicTimeSlots = generateTimeSlots(pickupDate);

  const handleCheckout = async () => {
    if (!pickupDate || !pickupTime) {
      alert("Veuillez choisir une date et une heure de retrait.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, pickupDate, pickupTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session Stripe");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-muted p-12 rounded-3xl text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-4">Votre panier est vide</h2>
        <p className="text-muted-foreground mb-8">Découvrez nos créations et laissez-vous tenter.</p>
        <button 
          onClick={() => router.push("/catalogue")}
          className="bg-foreground text-background px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-all shadow-lg"
        >
          Découvrir la collection
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-background rounded-[40px] shadow-sm border border-border overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {items.map((item) => (
              <div key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border last:border-0 last:pb-0">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                  <Image 
                    src={item.product.imageUrl || placeholderUrl}
                    alt={item.product.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow space-y-1">
                  <h3 className="font-bold font-serif text-xl">{item.product.name}</h3>
                  <p className="text-muted-foreground text-sm">{item.product.price.toFixed(2)} € / unité</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-muted px-3 py-2 rounded-full">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-foreground hover:text-background transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-4 text-center font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                      disabled={item.quantity >= item.product.inventory}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-20 text-right font-bold text-lg">
                    {(item.product.price * item.quantity).toFixed(2)} €
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-destructive hover:bg-destructive hover:text-white transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Click & Collect Selection */}
        <div className="bg-background rounded-[40px] shadow-sm border border-border p-6 md:p-8">
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            Retrait en boutique
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground h-5">Date de retrait</label>
              <select 
                value={pickupDate || ""}
                onChange={(e) => {
                  setPickupSlot(e.target.value, ""); // Reset time when date changes
                }}
                className="w-full bg-muted border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
              >
                <option value="" disabled>Sélectionner une date</option>
                {availableDates.map((date) => (
                  <option key={date.toISOString()} value={format(date, "yyyy-MM-dd")}>
                    {format(date, "EEEE d MMMM", { locale: fr })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground h-5">Heure de retrait</label>
              <select 
                value={pickupTime || ""}
                onChange={(e) => setPickupSlot(pickupDate || "", e.target.value)}
                disabled={!pickupDate || dynamicTimeSlots.length === 0}
                className="w-full bg-muted border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none appearance-none disabled:opacity-50"
              >
                <option value="" disabled>
                  {!pickupDate ? "Choisissez d'abord une date" : dynamicTimeSlots.length === 0 ? "Aucun créneau disponible" : "Sélectionner une heure"}
                </option>
                {dynamicTimeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            * Les commandes sont à retirer à notre boutique : {settings?.address}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-foreground text-background rounded-[40px] p-8 shadow-xl sticky top-32">
          <h2 className="text-2xl font-serif font-bold mb-8">Récapitulatif</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Sous-total</span>
              <span className="font-bold">{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Frais de préparation</span>
              <span className="font-bold">0.00 €</span>
            </div>
            <div className="w-full h-[1px] bg-white/20 my-4" />
            <div className="flex justify-between items-end">
              <span className="uppercase tracking-widest text-xs font-bold opacity-70">Total TTC</span>
              <span className="text-3xl font-light font-serif">{total.toFixed(2)} <span className="text-xl">€</span></span>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  checked={cgvAccepted}
                  onChange={(e) => setCgvAccepted(e.target.checked)}
                  className="w-5 h-5 border-2 border-primary rounded-md appearance-none checked:bg-primary transition-colors cursor-pointer"
                />
                <svg className={`absolute w-3 h-3 text-white pointer-events-none transition-opacity ${cgvAccepted ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 14 10" fill="none">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">
                J'accepte les <a href="/legal#cgv" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-primary transition-colors">Conditions Générales de Vente</a> et je m'engage à venir récupérer ma commande à la date et heure choisies.
              </span>
            </label>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={loading || !pickupDate || !pickupTime || !cgvAccepted}
            className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Chargement...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Payer {total.toFixed(2)} €
              </>
            )}
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2 opacity-50 text-xs">
            Paiement sécurisé par Stripe
          </div>
        </div>
      </div>
    </div>
  );
}
