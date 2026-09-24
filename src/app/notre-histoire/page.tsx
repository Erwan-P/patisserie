import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSiteAssetUrl } from '@/lib/storage';

export const metadata = {
  title: "Notre Histoire | La Maison Sucrée",
  description: "Découvrez l'histoire de Juliette et Maxime, fondateurs de La Maison Sucrée, et leur passion pour la pâtisserie artisanale d'excellence.",
};

const VineBackground = () => (
  <div 
    className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10 md:opacity-15"
    style={{ 
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
    }}
  >
    <svg 
      viewBox="0 0 100 1000" 
      preserveAspectRatio="none" 
      className="absolute top-0 left-[-10%] md:left-[-5%] w-[60%] md:w-[35%] h-[100%] stroke-primary fill-none"
    >
      <path d="M 0,-50 Q 150,250 50,500 T 20,1050" strokeWidth="0.6" />
      <path d="M 20,-50 Q -50,300 40,600 T 50,1050" strokeWidth="0.4" />
      <path d="M 40,-50 Q 120,400 10,700 T 80,1050" strokeWidth="0.2" />
    </svg>
  </div>
);

export default function NotreHistoirePage() {
  return (
    <div className="min-h-screen relative bg-[#FDFBF7] py-16 md:py-24">
      
      {/* Background Lierre (Ivy) */}
      <VineBackground />

      <div className="relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">Notre Histoire &<br/>Savoir-Faire</h1>
          </div>

          {/* Section 1 : Les Fondateurs */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-32">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A]">La Rencontre de<br/>Juliette & Maxime</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                C'est dans l'effervescence des cuisines d'un grand palace parisien que Juliette et Maxime se sont rencontrés. Elle, passionnée par la délicatesse des entremets ; lui, véritable orfèvre du feuilletage.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Unis par la même vision d'une pâtisserie authentique, généreuse et respectueuse des traditions, ils décident de quitter le monde de l'hôtellerie de luxe pour ouvrir "La Maison Sucrée". Leur ambition ? Proposer une pâtisserie de quartier à la hauteur des grands restaurants, accessible à tous les gourmands.
              </p>
            </div>
            <div className="lg:w-1/2">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  src={getSiteAssetUrl("founders-bakery.jpg")}
                  alt="Juliette et Maxime devant La Maison Sucrée" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Savoir-Faire */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16 mb-32">
            <div className="lg:w-1/2">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  src={getSiteAssetUrl("bakery-interior.jpg")}
                  alt="L'intérieur de notre boutique" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1A1A]">L'Artisanat avant tout</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                À La Maison Sucrée, tout est fait maison, chaque matin, avant le lever du soleil. L'excellence de nos créations réside dans la simplicité et le respect absolu du produit. Nous sélectionnons rigoureusement nos matières premières : le Beurre AOP de Charentes-Poitou garantit un feuilletage d'une légèreté incomparable, nos chocolats grands crus apportent intensité et longueur en bouche, et chaque gousse de vanille provient directement de Madagascar.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Notre engagement est total : tout est 100% fait maison chaque jour, nous privilégions les produits de saison sourcés localement, et nos recettes sont élaborées sans colorants ni arômes artificiels.
              </p>
            </div>
          </div>

          {/* CTA Final */}
          <div className="text-center pt-16">
            <Link 
              href="/catalogue"
              className="group inline-flex items-center gap-4 bg-foreground text-background hover:bg-primary hover:text-white px-10 py-5 rounded-full text-sm uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-xl hover:shadow-primary/30"
            >
              Découvrir toute la collection 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
