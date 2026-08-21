import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "Mon Profil | La Maison Sucrée",
};

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/auth/signin");
  }

  // Fetch full user data and orders
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Mon Espace Client
          </h1>
          <p className="text-muted-foreground text-lg">
            Gérez vos informations personnelles et retrouvez vos commandes.
          </p>
        </div>

        <ProfileClient user={user} />
      </div>
    </div>
  );
}
