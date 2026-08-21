"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateProduct } from "@/actions/product";
import MediaUploader, { MediaItem } from "@/components/admin/MediaUploader";

export default function EditProductForm({ product }: { product: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  let initialMedia = (product.media || []).map((m: any) => ({
    id: m.id,
    url: m.url,
    type: m.type as "IMAGE" | "VIDEO",
    size: 0 // Size doesn't matter for already uploaded
  })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  if (initialMedia.length === 0 && product.imageUrl) {
    initialMedia = [{
      id: "legacy-image",
      url: product.imageUrl,
      type: "IMAGE",
      size: 0
    }];
  }

  const [media, setMedia] = useState<MediaItem[]>(initialMedia);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (media.length === 0) {
      setError("Veuillez ajouter au moins un média (image ou vidéo).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      
      const mediaPayload = [];
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        let url = item.url;

        if (item.file) {
          const uploadData = new FormData();
          uploadData.append("file", item.file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadData,
          });
          const uploadJson = await uploadRes.json();
          if (uploadRes.ok) {
            url = uploadJson.url;
          } else {
            throw new Error(uploadJson.error || "Erreur upload média");
          }
        }

        mediaPayload.push({
          url: url!,
          type: item.type,
          order: i + 1
        });
      }

      const productData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        category: formData.get("category") as string,
        inventory: parseInt(formData.get("inventory") as string, 10),
        isSignature: formData.get("isSignature") === "on",
        // We no longer send signatureOrder from the form, it's managed via arrows in the list
        media: mediaPayload,
      };

      const res = await updateProduct(product.id, productData);
      
      if (res.error) throw new Error(res.error);

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-background p-8 rounded-2xl border border-border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground mb-4 block">Médias du Produit</label>
          <MediaUploader initialMedia={initialMedia} onChange={setMedia} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Nom</label>
            <input defaultValue={product.name} required type="text" name="name" className="w-full px-4 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Ex: Tarte au Citron Meringuée" />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Description</label>
            <textarea defaultValue={product.description} required name="description" rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" placeholder="Description de la pâtisserie..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Prix (€)</label>
            <input defaultValue={product.price} required type="number" name="price" step="0.01" min="0" className="w-full px-4 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="6.50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Stock</label>
            <input defaultValue={product.inventory} required type="number" name="inventory" min="0" className="w-full px-4 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="50" />
          </div>

          <div className="col-span-2 space-y-2">
            <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Catégorie</label>
            <select defaultValue={product.category} required name="category" className="w-full px-4 py-3 rounded-xl border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
              <option value="VIENNOISERIE">Viennoiserie</option>
              <option value="PATISSERIE">Pâtisserie</option>
              <option value="GATEAU">Gâteau</option>
              <option value="TARTES">Tartes</option>
            </select>
          </div>

          <div className="col-span-2 p-6 rounded-xl border border-border bg-muted/10 flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input defaultChecked={product.isSignature} type="checkbox" name="isSignature" className="w-5 h-5 rounded text-primary focus:ring-primary border-border" />
              <span className="font-bold text-sm uppercase tracking-widest">Afficher sur la page d'accueil (Section Signatures)</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-primary hover:text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </>
  );
}
