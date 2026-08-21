import React from 'react';
import { MapPin, Phone, Mail, Clock, Navigation, AlertCircle } from 'lucide-react';
import { getSettings } from '@/actions/settings';

export const metadata = {
  title: 'Contact - La Maison Sucrée',
  description: 'Venez nous rendre visite ou contactez-nous pour toute demande.',
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

export default async function ContactPage() {
  const settings = await getSettings();

  const address = settings?.address || "15 Place Vendôme, 75001 Paris";
  const phone = settings?.phone || "+33 1 23 45 67 89";
  const email = settings?.email || "contact@lamaisonsucree.fr";
  const isVacationMode = settings?.isVacationMode || false;
  
  const encodedAddress = encodeURIComponent(address);
  // Lien universel vers l'itinéraire Google Maps
  const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <div className="min-h-screen relative bg-[#FDFBF7] py-16 md:py-24">
      <VineBackground />
      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">Contact & Accès</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une commande spéciale, un événement à célébrer, ou simplement l'envie de déguster nos créations ? N'hésitez pas à nous contacter ou à venir nous rendre visite.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Section Informations */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-8">Nos Coordonnées</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Adresse</h3>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Téléphone</h3>
                    <p className="text-muted-foreground"><a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-primary transition-colors">{phone}</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email</h3>
                    <p className="text-muted-foreground"><a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a></p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold mb-8">Horaires d'Ouverture</h2>
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-border">
                <div className="flex items-start gap-4">
                  <div className="text-primary mt-1">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="w-full">
                    <ul className="space-y-4">
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Lundi</span>
                        <span className={`font-medium ${isVacationMode ? "text-destructive font-bold" : ""}`}>
                          {isVacationMode ? "Fermé (Congés)" : settings?.hoursMonday}
                        </span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Mardi</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursTuesday}</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Mercredi</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursWednesday}</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Jeudi</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursThursday}</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Vendredi</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursFriday}</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border pb-4">
                        <span className="text-muted-foreground">Samedi</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursSaturday}</span>
                      </li>
                      <li className="flex justify-between items-center pt-1">
                        <span className="text-muted-foreground">Dimanche</span>
                        <span className="font-medium">{isVacationMode ? "-" : settings?.hoursSunday}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Carte Interactive */}
          <div className="flex flex-col h-full">
            <h2 className="text-3xl font-serif font-bold mb-8">Nous Trouver</h2>
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-lg border border-border bg-muted mb-8">
              {/* iframe Google Maps Dynamique */}
              <iframe
                src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              ></iframe>
            </div>

            <div className="flex justify-center">
              <a 
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-bold text-lg hover:bg-primary hover:text-white transition-colors group shadow-xl"
              >
                <Navigation className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                Nous rendre visite
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
