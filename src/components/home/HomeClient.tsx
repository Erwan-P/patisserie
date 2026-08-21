"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@prisma/client";

// Composant pour le motif de fond (courbes très douces façon lierre)
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

export default function HomeClient({ featuredProducts }: { featuredProducts: (Product & { media?: any[] })[] }) {
  return (
    <div className="w-full bg-background selection:bg-primary selection:text-white overflow-hidden">
      
      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative min-h-[calc(100lvh-80px)] flex flex-col md:flex-row items-center justify-start pt-8 md:pt-0 overflow-hidden md:overflow-visible">
        
        <div className="w-full md:w-[60vw] relative z-20 flex flex-col justify-center pointer-events-none order-1">
          
          <div className="w-full pl-4 md:pl-12 lg:pl-[calc(50vw-640px)] pointer-events-auto">
            <div className="relative">
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-[18vw] md:text-[12vw] lg:text-[10vw] leading-[0.8] tracking-tighter text-foreground whitespace-nowrap"
              >
                LA MAISON
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 md:gap-8 mt-2 md:mt-4 ml-[5vw] md:ml-[10vw]"
              >
                <div className="hidden md:block w-16 lg:w-24 h-[2px] bg-primary"></div>
                <h1 className="font-serif italic text-[18vw] md:text-[12vw] lg:text-[10vw] leading-[0.8] tracking-tighter text-primary whitespace-nowrap drop-shadow-sm">
                  SUCRÉE.
                </h1>
              </motion.div>
            </div>
          </div>

          {/* Desktop Description */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="hidden md:flex w-full flex-col items-center text-center mt-24 px-8 pointer-events-auto"
          >
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed font-light max-w-md">
              Redéfinissez l'expérience gourmande avec nos créations artisanales. 
              L'équilibre parfait entre tradition française et audace contemporaine.
            </p>
            
            <Link 
              href="/notre-histoire"
              className="group inline-flex items-center gap-4 text-foreground hover:text-primary transition-colors"
            >
              <span className="text-sm uppercase tracking-widest font-bold">Notre Savoir-Faire</span>
              <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative md:absolute right-0 md:top-1/2 md:-translate-y-1/2 w-[90vw] md:w-[45vw] lg:w-[40vw] h-[40vh] md:h-[80vh] rounded-tl-[60px] md:rounded-tl-[120px] rounded-bl-[60px] md:rounded-bl-[120px] overflow-hidden shadow-2xl z-10 self-end mt-8 md:mt-0 order-2 md:order-none"
        >
          <Image
            src="/images/hero.jpg"
            alt="Pâtisserie d'exception"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/20 hidden md:block"></div>
        </motion.div>

        {/* Mobile Description */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="md:hidden w-full flex flex-col items-center text-center mt-8 mb-12 px-6 pointer-events-auto order-3 relative z-20"
        >
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed font-light max-w-md">
            Redéfinissez l'expérience gourmande avec nos créations artisanales. 
            L'équilibre parfait entre tradition française et audace contemporaine.
          </p>
          
          <Link 
            href="/notre-histoire"
            className="group inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors bg-primary/5 px-6 py-3 rounded-full border border-primary/10"
          >
            <span className="text-xs uppercase tracking-widest font-bold">Notre Savoir-Faire</span>
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      <div className="relative bg-transparent">
        
        <VineBackground />

        {/* -------------------- SIGNATURE PRODUCTS -------------------- */}
        <section className="pt-16 pb-24 md:pt-20 md:pb-40 px-4 md:px-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center mb-16 md:mb-32">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-serif text-5xl md:text-7xl text-foreground"
              >
                Créations <span className="italic text-muted-foreground">Signatures</span>
              </motion.h2>
            </div>

            <div className="flex flex-col gap-32 md:gap-40 relative z-20">
              {featuredProducts.map((product, index) => {
                const isEven = index % 2 !== 0; 
                const firstMedia = product.media?.[0];
                const isVideo = firstMedia?.type === "VIDEO";
                
                return (
                  <div key={product.id} className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}>
                    
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full md:w-1/2 relative group cursor-pointer"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-tr-[80px] rounded-bl-[80px] md:rounded-tr-[120px] md:rounded-bl-[120px] shadow-2xl bg-muted">
                        {isVideo ? (
                          <video 
                            src={firstMedia.url} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                          />
                        ) : (
                          <Image 
                            src={product.imageUrl || "/images/placeholder.jpg"} 
                            alt={product.name} 
                            fill 
                            className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500"></div>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full md:w-1/2 flex flex-col ${isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left'} text-center`}
                    >

                      <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-8 text-foreground leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-light max-w-md">
                        {product.description}
                      </p>
                      
                      <div className="mt-10">
                        <Link 
                          href={`/catalogue?productId=${product.id}`}
                          className="group inline-flex items-center gap-3 uppercase tracking-widest text-xs font-bold hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="relative">
                            En savoir plus
                            <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-300"></span>
                          </span>
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                        </Link>
                      </div>
                    </motion.div>

                  </div>
                );
              })}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-40 text-center relative z-20"
            >
              <Link 
                href="/catalogue"
                className="group inline-flex items-center gap-4 bg-foreground text-background hover:bg-primary hover:text-white px-10 py-5 rounded-full text-sm uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-xl hover:shadow-primary/30"
              >
                Découvrir toute la collection 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </motion.div>

          </div>
        </section>
      </div>
    </div>
  );
}
