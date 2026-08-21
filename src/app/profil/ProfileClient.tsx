"use client";

import { useState, useTransition } from "react";
import { updateProfile, deleteAccount } from "@/actions/user";
import { signOut } from "next-auth/react";
import { AlertCircle, Package, User, Trash2, LogOut, Settings } from "lucide-react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";

export default function ProfileClient({ user }: { user: any }) {
  const [name, setName] = useState(user.name || "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    startTransition(async () => {
      const res = await updateProfile(name);
      if (res.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: "Profil mis à jour avec succès.", type: "success" });
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte et l'historique de vos commandes ? Cette action est irréversible.")) {
      return;
    }
    
    setIsDeleting(true);
    const res = await deleteAccount();
    if (res.error) {
      alert(res.error);
      setIsDeleting(false);
    } else {
      signOut({ callbackUrl: "/" });
    }
  };

  return (
    <div className="space-y-16">
      
      {/* SECTION 1: PROFIL */}
      <section className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold">Mes Informations</h2>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground">Adresse Email</label>
            <input 
              type="email" 
              value={user.email} 
              disabled 
              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-2">Votre email ne peut pas être modifié car il sert à votre connexion (Lien Magique).</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Prénom & Nom</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-foreground text-background hover:bg-primary hover:text-white px-8 py-3 rounded-xl text-sm uppercase tracking-widest font-bold transition-all disabled:opacity-50"
          >
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </section>

      {/* SECTION 2: COMMANDES */}
      <section id="commandes" className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-border scroll-mt-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold">Mes Commandes</h2>
        </div>

        {user.orders.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">Vous n'avez pas encore passé de commande.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {user.orders.map((order: any) => (
              <div key={order.id} className="border border-border rounded-2xl p-6 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-border gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-mono">Commande #{order.id.slice(-8).toUpperCase()}</p>
                    <p className="font-semibold text-foreground">
                      Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    {order.pickupDate && (
                      <p className="text-sm font-bold text-primary mt-1">
                        Retrait prévu le {new Date(order.pickupDate).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                      {order.status === "PENDING" ? "En attente" : 
                       order.status === "PAID" ? "Payée" : 
                       order.status === "PREPARING" ? "En préparation" : 
                       order.status === "READY" ? "Prête" : 
                       order.status === "COMPLETED" ? "Terminée" :
                       order.status === "CANCELLED" ? "Annulée" : order.status}
                    </span>
                    <span className="font-bold text-lg">{order.total.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x {item.price.toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: ZONE DANGEREUSE */}
      <section className={`p-8 md:p-12 rounded-[2rem] border ${user.role === 'ADMIN' ? 'bg-muted/50 border-border grayscale' : 'bg-red-50/50 border-red-100'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-muted text-muted-foreground' : 'bg-red-100 text-red-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className={`text-2xl font-serif font-bold ${user.role === 'ADMIN' ? 'text-muted-foreground' : 'text-red-950'}`}>Zone Dangereuse</h2>
        </div>
        <p className={`${user.role === 'ADMIN' ? 'text-muted-foreground' : 'text-red-800'} mb-8 max-w-2xl`}>
          {user.role === 'ADMIN' 
            ? "En tant qu'administrateur du site, vous ne pouvez pas supprimer votre compte. Ce filet de sécurité empêche la perte d'accès au tableau de bord."
            : "La suppression de votre compte entraînera l'effacement définitif de vos données personnelles et de l'historique de vos commandes. Cette action est irréversible."
          }
        </p>
        <div className="flex flex-col gap-4">
          {/* Mobile Only Actions */}
          <div className="md:hidden flex flex-col gap-4 mb-4">
            {user.role === 'ADMIN' && (
              <Link 
                href="/admin"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors bg-primary hover:bg-primary/90 text-white"
              >
                <Settings className="w-5 h-5" />
                Administration
              </Link>
            )}
            <button 
              onClick={() => {
                useCartStore.getState().clearCart();
                signOut({ callbackUrl: '/' });
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors bg-muted hover:bg-muted/80 text-foreground"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>

          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting || user.role === 'ADMIN'}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              user.role === 'ADMIN' 
                ? 'bg-muted text-muted-foreground' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? "Suppression..." : "Supprimer mon compte"}
          </button>
        </div>
      </section>

    </div>
  );
}
