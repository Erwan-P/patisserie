"use client";

import { Pencil, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { deleteProduct } from "@/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    setLoading(true);
    const res = await deleteProduct(id);
    
    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/products/${id}/edit`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
        <Pencil className="w-4 h-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={loading}
        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
