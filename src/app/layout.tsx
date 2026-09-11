import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Clear2faOnLeave from "@/components/Clear2faOnLeave";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "La Maison Sucrée | Pâtisserie d'Exception",
  description: "Commandez en ligne nos pâtisseries artisanales. Click & Collect et livraison.",
  icons: {
    icon: "/images/logo.jpg",
    apple: "/images/logo.jpg",
  },
};

import { getSettings } from "@/actions/settings";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="fr" className={clsx(inter.variable, playfair.variable)}>
      <body className="antialiased min-h-[100lvh] flex flex-col">
        <AuthProvider>
          <Clear2faOnLeave />
            <Header />
            <main className="flex-grow">
              {children}
            </main>
          <Footer settings={settings} />
        </AuthProvider>
      </body>
    </html>
  );
}
