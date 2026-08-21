import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const baseUrl = req.headers.get("origin") || (host ? `${protocol}://${host}` : (process.env.NEXTAUTH_URL || "http://localhost:3000"));

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour commander." },
        { status: 401 }
      );
    }

    const { items, pickupDate, pickupTime } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }

    // Vérification du mode vacances
    const storeSettings = await prisma.storeSettings.findUnique({ where: { id: "MAIN" } });
    if (storeSettings?.isVacationMode) {
      return NextResponse.json({ error: "La boutique est actuellement en mode vacances, les commandes sont suspendues." }, { status: 400 });
    }

    if (!pickupDate || !pickupTime) {
      return NextResponse.json({ error: "Veuillez choisir une date et heure de retrait." }, { status: 400 });
    }

    // Validation du délai minimum (2 heures)
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
    const minimumTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    if (pickupDateTime < minimumTime) {
      return NextResponse.json({ error: "Le délai minimum de préparation est de 2 heures." }, { status: 400 });
    }

    // Sécurisation: Récupérer les vrais prix depuis la base de données
    const productIds = items.map((item: any) => item.product.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Préparer les produits pour Stripe
    const lineItems = items.map((item: any) => {
      const dbProduct = dbProducts.find((p) => p.id === item.product.id);
      
      if (!dbProduct) {
        throw new Error(`Produit introuvable: ${item.product.id}`);
      }

      if (dbProduct.inventory < item.quantity) {
        throw new Error(`Stock insuffisant pour ${dbProduct.name}`);
      }

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: dbProduct.name,
            images: dbProduct.imageUrl ? [new URL(dbProduct.imageUrl, baseUrl).toString()] : [],
          },
          unit_amount: Math.round(dbProduct.price * 100), // Vrai prix de la DB
        },
        quantity: item.quantity,
      };
    });

    // Stocker les infos sécurisées pour le Webhook
    const secureCartItems = items.map((item: any) => {
      const dbProduct = dbProducts.find((p) => p.id === item.product.id);
      return { 
        id: item.product.id, 
        quantity: item.quantity, 
        price: dbProduct?.price || 0 
      };
    });

    // Créer la session Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/panier`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        pickupDate,
        pickupTime,
        cartItems: JSON.stringify(secureCartItems)
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Erreur Checkout Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
