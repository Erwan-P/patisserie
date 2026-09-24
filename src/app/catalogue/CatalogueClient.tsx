"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight, ChevronLeft, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { incrementProductView } from "@/actions/product";

const CATEGORIES = [
  { id: "ALL", label: "Tout Voir" },
  { id: "VIENNOISERIE", label: "Viennoiseries" },
  { id: "PATISSERIE", label: "Pâtisseries" },
  { id: "TARTES", label: "Tartes" },
  { id: "GATEAU", label: "Gâteaux" },
];

export default function CatalogueClient({ initialProducts, placeholderUrl }: {
  initialProducts: any[];
  placeholderUrl: string;
}) {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      const p = initialProducts.find((prod) => prod.id === productId);
      if (p) {
        setSelectedProduct(p);
      }
    }
  }, [searchParams, initialProducts]);

  useEffect(() => {
    if (selectedProduct && selectedProduct.id) {
      incrementProductView(selectedProduct.id);
    }
  }, [selectedProduct]);

  const handleCloseModal = () => {
    setSelectedProduct(null);
    // Remove query param without reloading page
    router.replace('/catalogue', { scroll: false });
  };

  const filteredProducts = activeCategory === "ALL" 
    ? initialProducts 
    : initialProducts.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-12">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
              activeCategory === category.id 
                ? "bg-foreground text-background shadow-lg scale-105" 
                : "bg-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>      
      
      {/* Staggered Masonry Grid using Flex Columns for perfect gaps */}
      
      {/* 1. Desktop (3 colonnes) */}
      <div className="hidden lg:flex gap-12 pb-24 items-start">
        <div className="flex flex-col gap-12 flex-1">
          <AnimatePresence>
            {filteredProducts.filter((_, i) => i % 3 === 0).map(p => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-12 flex-1 mt-32">
          <AnimatePresence>
            {filteredProducts.filter((_, i) => i % 3 === 1).map(p => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-12 flex-1">
          <AnimatePresence>
            {filteredProducts.filter((_, i) => i % 3 === 2).map(p => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Tablette (2 colonnes) */}
      <div className="hidden md:flex lg:hidden gap-8 pb-16 items-start">
        <div className="flex flex-col gap-8 flex-1">
          <AnimatePresence>
            {filteredProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-8 flex-1 mt-24">
          <AnimatePresence>
            {filteredProducts.filter((_, i) => i % 2 === 1).map(p => <ProductCard key={p.id} product={p} />)}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Mobile (1 colonne) */}
      <div className="flex md:hidden flex-col gap-8 pb-8">
        <AnimatePresence>
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={handleCloseModal} 
            placeholderUrl={placeholderUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );

  function ProductCard({ product }: { product: any }) {
    const firstMedia = product.media?.[0];
    const thumbUrl = firstMedia?.type === "IMAGE" ? firstMedia.url : (product.imageUrl || placeholderUrl);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="group cursor-pointer flex flex-col w-full"
        onClick={() => setSelectedProduct(product)}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[5rem] md:rounded-t-[6rem] rounded-b-3xl md:rounded-b-2xl bg-muted shadow-sm group-hover:shadow-2xl transition-all duration-700 flex-shrink-0">
          {firstMedia?.type === "VIDEO" ? (
            <video 
              src={firstMedia.url} 
              autoPlay muted loop playsInline 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
            />
          ) : (
            <img 
              src={thumbUrl} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/0 opacity-80 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
          
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col items-center text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-center mb-2">{product.name}</h3>
            <div className="flex items-center justify-center gap-3">
              <p className="text-white/80 uppercase tracking-widest text-[10px] font-bold">
                {product.category.toLowerCase().replace('_', ' ')}
              </p>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <span className="font-bold text-xl">{product.price.toFixed(2)} €</span>
            </div>
          </div>


        </div>
      </motion.div>
    );
  }
}

// ----------------------------------------------------
// PRODUCT MODAL COMPONENT (Internal for now)
// ----------------------------------------------------
function ProductModal({ product, onClose, placeholderUrl }: {
  product: any;
  onClose: () => void;
  placeholderUrl: string;
}) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const router = useRouter();
  const { status } = useSession();
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    // Bloquer le scroll de la page quand la modale est ouverte
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleAddToCart = () => {
    if (status !== "authenticated") {
      if (confirm("Vous devez être connecté pour ajouter des articles à votre panier. Voulez-vous vous connecter ?")) {
        router.push("/auth/signin");
      }
      return;
    }
    
    if (product.inventory <= 0) {
      alert("Ce produit est en rupture de stock.");
      return;
    }

    addItem(product);
    onClose();
  };

  const mediaList = product.media?.length > 0 
    ? product.media 
    : [{ id: "fallback", url: product.imageUrl || placeholderUrl, type: "IMAGE" }];

  const currentMedia = mediaList[currentMediaIndex];

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
    setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl bg-background rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 bg-background/50 backdrop-blur-md flex items-center justify-center rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Section */}
        <div className="w-full md:w-1/2 relative bg-muted h-[30vh] min-h-[220px] md:h-auto md:min-h-[300px] flex-shrink-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            {currentMedia.type === "VIDEO" ? (
              <motion.video 
                key={currentMediaIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                src={currentMedia.url} 
                autoPlay 
                muted 
                loop 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <motion.img 
                key={currentMediaIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                src={currentMedia.url} 
                alt={product.name} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </AnimatePresence>

          {/* Navigation Arrows */}
          {mediaList.length > 1 && (
            <>
              <button 
                onClick={prevMedia}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-background/50 backdrop-blur-md flex items-center justify-center rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors z-20"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={nextMedia}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-background/50 backdrop-blur-md flex items-center justify-center rounded-full text-foreground hover:bg-foreground hover:text-background transition-colors z-20"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              {/* Dots */}
              <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {mediaList.map((_: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setDirection(idx > currentMediaIndex ? 1 : -1);
                      setCurrentMediaIndex(idx); 
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentMediaIndex ? "bg-foreground w-6" : "bg-foreground/40 hover:bg-foreground/70"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* En-tête fixe */}
          <div className="flex-shrink-0 space-y-2 md:space-y-4">
            <div>
              <p className="text-primary font-bold uppercase tracking-widest text-[10px] mb-2 md:mb-3">
                {product.category.toLowerCase().replace('_', ' ')}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">{product.name}</h2>
            </div>
            
            <div className="text-2xl md:text-3xl font-light">
              {product.price.toFixed(2)} <span className="text-lg md:text-xl">€</span>
            </div>

            <div className="w-12 h-[2px] bg-border my-4" />
          </div>

          {/* Description scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            <div className="prose prose-sm text-muted-foreground leading-relaxed pb-4">
              <p>{product.description}</p>
            </div>
          </div>

          {/* Boutons fixes en bas */}
          <div className="flex-shrink-0 pt-4 md:pt-6 mt-2 border-t border-border space-y-4 bg-background">
            <button 
              onClick={handleAddToCart}
              disabled={product.inventory <= 0}
              className="w-full bg-foreground text-background hover:bg-primary hover:text-white py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <ShoppingBag className="w-4 h-4" />
              {product.inventory > 0 ? "Ajouter au panier" : "Indisponible"}
            </button>
            <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {product.inventory > 0 ? (
                <span className="text-green-600">En stock</span>
              ) : (
                <span className="text-destructive">Rupture de stock</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
