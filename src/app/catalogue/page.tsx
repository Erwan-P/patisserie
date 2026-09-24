import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CatalogueClient from "./CatalogueClient";
import { Metadata } from "next";
import { getSiteAssetUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "La Carte | La Maison Sucrée",
  description: "Découvrez nos créations artisanales, confectionnées chaque jour avec passion et des ingrédients d'exception. Commandez en Click & Collect.",
  openGraph: {
    title: "La Carte | La Maison Sucrée",
    description: "Découvrez nos créations artisanales, confectionnées chaque jour avec passion et des ingrédients d'exception.",
    images: [getSiteAssetUrl("hero.jpg")],
  }
};

const VineBackground = () => {
  const leftSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 100 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' stroke='%23C5A992' fill='none'%3E%3Cpath d='M 0,-50 Q 150,250 50,500 T 0,1050' stroke-width='0.6'/%3E%3Cpath d='M 20,-50 Q -50,300 40,600 T 20,1050' stroke-width='0.4'/%3E%3Cpath d='M 40,-50 Q 120,400 10,700 T 40,1050' stroke-width='0.2'/%3E%3C/svg%3E`;
  const rightSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 100 1000' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' stroke='%23C5A992' fill='none'%3E%3Cpath d='M 100,-50 Q -50,350 50,650 T 100,1050' stroke-width='0.5'/%3E%3Cpath d='M 80,-50 Q 130,400 40,700 T 80,1050' stroke-width='0.3'/%3E%3C/svg%3E`;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-[0.12] overflow-hidden flex justify-between">
      <div 
        className="w-[40%] md:w-[25%] h-full"
        style={{ 
          backgroundImage: `url("${leftSvg}")`,
          backgroundSize: '100% 1200px',
          backgroundRepeat: 'repeat-y'
        }}
      />
      <div 
        className="w-[40%] md:w-[25%] h-full"
        style={{ 
          backgroundImage: `url("${rightSvg}")`,
          backgroundSize: '100% 1200px',
          backgroundRepeat: 'repeat-y'
        }}
      />
    </div>
  );
};

export const dynamic = 'force-dynamic'; // Ensures it fetches fresh data

export default async function CataloguePage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      media: {
        orderBy: { order: 'asc' }
      }
    }
  });

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] selection:bg-primary/20 selection:text-primary overflow-hidden">
      <VineBackground />
      
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6 mb-16 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground">La Carte</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm leading-relaxed">
            Découvrez nos créations artisanales, confectionnées chaque jour avec passion et des ingrédients d'exception.
          </p>
        </div>

        <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Chargement de la carte...</div>}>
          <CatalogueClient
            initialProducts={products}
            placeholderUrl={getSiteAssetUrl("placeholder_pastry.jpg")}
          />
        </Suspense>
      </div>
    </div>
  );
}
