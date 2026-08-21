import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { media: true }
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif">Modifier un Produit</h1>
        <p className="text-muted-foreground mt-2">Mettez à jour les informations de votre pâtisserie.</p>
      </div>
      
      <EditProductForm product={product} />
    </div>
  );
}
