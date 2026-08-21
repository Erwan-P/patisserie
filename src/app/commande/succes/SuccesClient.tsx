"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useCartStore } from "@/lib/store";
import { CheckCircle2, XCircle } from "lucide-react";

export default function SuccesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const { clearCart, clearPickupSlot } = useCartStore();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Aucune session trouvée.");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyOrder = async () => {
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Erreur de vérification");
        }
        
        if (data.success) {
          // La commande a été créée par le webhook !
          clearCart();
          clearPickupSlot();
          setStatus("success");
        } else if (data.status === "processing") {
          // Le webhook n'a pas encore fini, on réessaie dans 2 secondes
          setTimeout(verifyOrder, 2000);
        }
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message);
      }
    };

    verifyOrder();
  }, [sessionId, clearCart, clearPickupSlot]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-3xl font-serif font-bold animate-pulse">Validation de votre paiement...</h1>
        <p className="text-muted-foreground">Veuillez patienter, ne fermez pas cette page.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6 bg-red-50 p-12 rounded-3xl">
        <XCircle className="w-20 h-20 text-destructive mx-auto" />
        <h1 className="text-3xl font-serif font-bold text-destructive">Erreur</h1>
        <p className="text-muted-foreground">{errorMessage}</p>
        <button 
          onClick={() => router.push("/panier")}
          className="mt-8 bg-foreground text-background px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary transition-all"
        >
          Retour au panier
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-background p-12 rounded-[40px] shadow-sm border border-border">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      
      <h1 className="text-4xl font-serif font-bold">Commande validée !</h1>
      <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
        Merci pour votre commande. Un email récapitulatif contenant votre facture vous a été envoyé.
      </p>
      
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          onClick={() => router.push("/profil")}
          className="w-full sm:w-auto bg-foreground text-background px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary transition-all shadow-lg"
        >
          Voir mes commandes
        </button>
        <button 
          onClick={() => router.push("/catalogue")}
          className="w-full sm:w-auto bg-transparent border-2 border-foreground text-foreground px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-all"
        >
          Retour à la boutique
        </button>
      </div>
    </div>
  );
}
