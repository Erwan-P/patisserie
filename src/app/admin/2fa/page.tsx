"use client";

import { useState } from "react";
import { verifyAdmin2FA } from "@/actions/admin";
import { useRouter } from "next/navigation";

export default function Admin2FA() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;

    setLoading(true);
    setError("");

    const res = await verifyAdmin2FA(pin);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-sm p-8 text-center">
        <h1 className="font-serif text-3xl font-bold mb-2">Sécurité Admin</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Veuillez entrer le code de sécurité à 6 chiffres pour accéder à l'espace de gestion.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full text-center tracking-[1em] text-2xl px-4 py-4 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
            placeholder="••••••"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full bg-foreground text-background hover:bg-primary hover:text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
          >
            {loading ? "Vérification..." : "Valider"}
          </button>
        </form>
      </div>
    </div>
  );
}
