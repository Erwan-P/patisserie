"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignInMethod, reset2FA } from "@/actions/auth";

export default function SignIn() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push(adminMode ? "/admin" : "/profil");
    }
  }, [status, adminMode, router]);

  if (status === "authenticated") {
    return null;
  }

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!adminMode) {
        const method = await getSignInMethod(email);
        if (method === "invalid") {
          setError("Saisissez une adresse e-mail valide.");
          return;
        }
        if (method === "limited") {
          setError("Trop de tentatives. Réessayez dans quelques minutes.");
          return;
        }
        if (method === "password") {
          setAdminMode(true);
          return;
        }
        await signIn("email", { redirect: false, email });
        setError("Si cette adresse permet la connexion, un lien vous sera envoyé. Vérifiez votre boîte mail.");
        return;
      }

      await reset2FA();
      const res = await signIn("credentials", { redirect: false, email, password });
      if (!res?.ok || res.error) {
        setError("Identifiants incorrects.");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("La connexion est momentanément indisponible. Réessayez plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-md bg-background rounded-3xl shadow-2xl p-8 md:p-12 border border-border">
        <h1 className="font-serif text-3xl font-bold mb-2 text-center text-foreground">
          Connexion
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {adminMode ? "Connectez-vous à votre espace de gestion." : "Entrez votre email pour continuer."}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 text-primary text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleNextStep} className="space-y-6">
          {(
            <div>
              <label className="block text-sm font-semibold mb-2">Adresse Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAdminMode(false);
                  setPassword("");
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="vous@exemple.com"
              />
            </div>
          )}

          {adminMode && (
            <div>
              <label className="block text-sm font-semibold mb-2">Mot de passe</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                disabled={loading}
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
