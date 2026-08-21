import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PanierClient from "./PanierClient";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PanierPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch shop settings to know opening hours for the click and collect slots
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "MAIN" }
  });

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Mon Panier
          </h1>
          <p className="text-muted-foreground text-lg">
            Vérifiez vos articles et choisissez votre heure de retrait.
          </p>
        </div>
        <PanierClient settings={settings} />
      </div>
    </div>
  );
}
