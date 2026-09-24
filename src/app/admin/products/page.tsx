import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search, Tag, Eye, ShoppingBag, Euro, AlertCircle, Sparkles } from "lucide-react";
import ProductActions from "@/components/admin/ProductActions";
import SignatureOrderControls from "@/components/admin/SignatureOrderControls";
import { getSiteAssetUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const placeholderUrl = getSiteAssetUrl("placeholder_pastry.jpg");
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { media: { orderBy: { order: 'asc' } } }
  });

  const signatureProducts = products
    .filter(p => p.isSignature)
    .sort((a, b) => (a.signatureOrder || 999) - (b.signatureOrder || 999));
    
  const regularProducts = products.filter(p => !p.isSignature);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold font-serif">Catalogue</h1>
          <p className="text-muted-foreground mt-1">Gérez vos pâtisseries et créations.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all font-bold text-sm tracking-wide uppercase shadow-lg shadow-foreground/5 hover:shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Ajouter un produit
        </Link>
      </div>

      {/* SIGNATURE PRODUCTS */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center gap-3 bg-primary/5">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-bold uppercase tracking-widest text-primary">Produits à la Une (Page d'accueil)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold tracking-widest w-16 text-center">Ordre</th>
                <th className="px-6 py-4 font-bold tracking-widest">Produit</th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">Prix</th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">Stats</th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">Stock</th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signatureProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun produit sélectionné pour la page d'accueil.
                  </td>
                </tr>
              ) : signatureProducts.map((product, index) => {
                return (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <span className="font-serif text-xl font-bold text-muted-foreground">#{index + 1}</span>
                        <SignatureOrderControls 
                          productId={product.id} 
                          isFirst={index === 0} 
                          isLast={index === signatureProducts.length - 1} 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted relative flex-shrink-0 border border-border">
                          <img src={product.imageUrl || placeholderUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{product.name}</div>
                          <div className="text-muted-foreground text-xs">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-base">{product.price.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1" title="Ventes"><ShoppingBag className="w-4 h-4"/> {product.sales}</div>
                        <div className="flex items-center gap-1" title="Vues"><Eye className="w-4 h-4"/> {product.views}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.inventory < 10 ? (
                        <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Reste {product.inventory}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          En stock ({product.inventory})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ProductActions id={product.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGULAR PRODUCTS */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold uppercase tracking-widest text-muted-foreground">Autres Produits (Catalogue classique)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold tracking-widest">Produit</th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">Prix</th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">Stats</th>
                <th className="px-6 py-4 font-bold tracking-widest text-center">Stock</th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {regularProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun autre produit.
                  </td>
                </tr>
              ) : regularProducts.map((product) => {
                return (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted relative flex-shrink-0 border border-border">
                          <img src={product.imageUrl || placeholderUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-base group-hover:text-primary transition-colors">{product.name}</div>
                          <div className="text-muted-foreground text-xs">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-base">{product.price.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1" title="Ventes"><ShoppingBag className="w-4 h-4"/> {product.sales}</div>
                        <div className="flex items-center gap-1" title="Vues"><Eye className="w-4 h-4"/> {product.views}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.inventory < 10 ? (
                        <span className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" /> Reste {product.inventory}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                          En stock ({product.inventory})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <ProductActions id={product.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
