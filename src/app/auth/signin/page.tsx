"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsAdmin, reset2FA } from "@/actions/auth";

import { useEffect } from "react";

export default function SignIn() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/profil");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return null;
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (step === 1) {
      // Check if email belongs to admin
      const adminCheck = await checkIsAdmin(email);
      if (adminCheck) {
        setIsAdmin(true);
        setStep(2);
        setLoading(false);
      } else {
        // Normal user -> Send magic link directly
        const res = await signIn("email", {
          redirect: false,
          email,
        });

        if (res?.error) {
          setError("Erreur lors de l'envoi du lien magique.");
        } else {
          setError("Lien magique envoyé ! Vérifiez votre boîte mail.");
        }
        setLoading(false);
      }
    } else if (step === 2 && isAdmin) {
      // Step 2 for Admin -> Force reset 2FA before login
      await reset2FA();

      // Check password
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Identifiants incorrects.");
        setLoading(false);
      } else {
        router.push("/admin");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl p-8 md:p-12 border border-border">
        <h1 className="font-serif text-3xl font-bold mb-2 text-center text-foreground">
          Connexion
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {step === 1 ? "Entrez votre email pour continuer." : "Entrez votre mot de passe."}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 text-primary text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleNextStep} className="space-y-6">
          {step === 1 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Adresse Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="vous@exemple.com"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-semibold mb-2">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-primary hover:text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
