import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CartInput = {
  product?: { id?: unknown };
  quantity?: unknown;
};

function getPublicBaseUrl(req: Request) {
  if (process.env.NEXTAUTH_URL) return new URL(process.env.NEXTAUTH_URL).origin;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_URL doit être configuré en production.");
  }
  return new URL(req.url).origin;
}

function isPickupSlotOpen(schedule: string, pickupTime: string) {
  const [hour, minute] = pickupTime.split(":").map(Number);
  if (minute % 30 !== 0) return false;
  const requestedMinutes = hour * 60 + minute;

  return schedule.split(",").some((slot) => {
    const match = slot.trim().match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
    if (!match) return false;
    const opening = Number(match[1]) * 60 + Number(match[2]);
    const closing = Number(match[3]) * 60 + Number(match[4]);
    return requestedMinutes >= opening && requestedMinutes <= closing;
  });
}

export async function POST(req: Request) {
  try {
    const baseUrl = getPublicBaseUrl(req);

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour commander." },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const { items, pickupDate, pickupTime } = body as {
      items?: CartInput[];
      pickupDate?: string;
      pickupTime?: string;
    };

    if (!Array.isArray(items) || items.length === 0 || items.length > 25) {
      return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    }

    const quantities = new Map<string, number>();
    for (const item of items) {
      const id = item?.product?.id;
      const quantity = item?.quantity;
      if (typeof id !== "string" || !Number.isInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 50) {
        return NextResponse.json({ error: "Le panier contient un article invalide." }, { status: 400 });
      }
      quantities.set(id, (quantities.get(id) ?? 0) + Number(quantity));
    }
    if ([...quantities.values()].some((quantity) => quantity > 50)) {
      return NextResponse.json({ error: "Quantité maximale dépassée." }, { status: 400 });
    }

    // Vérification du mode vacances
    const storeSettings = await prisma.storeSettings.findUnique({ where: { id: "MAIN" } });
    if (!storeSettings) {
      return NextResponse.json({ error: "Les horaires de la boutique ne sont pas configurés." }, { status: 503 });
    }
    if (storeSettings?.isVacationMode) {
      return NextResponse.json({ error: "La boutique est actuellement en mode vacances, les commandes sont suspendues." }, { status: 400 });
    }

    if (!pickupDate || !pickupTime || !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
      return NextResponse.json({ error: "Veuillez choisir une date et heure de retrait." }, { status: 400 });
    }

    // Validation du délai minimum (2 heures)
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00Z`);
    const minimumTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const maximumTime = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    if (
      Number.isNaN(pickupDateTime.getTime()) ||
      pickupDateTime.toISOString().slice(0, 10) !== pickupDate ||
      pickupDateTime < minimumTime ||
      pickupDateTime > maximumTime
    ) {
      return NextResponse.json({ error: "Le délai minimum de préparation est de 2 heures." }, { status: 400 });
    }

    const schedules = [
      storeSettings.hoursSunday,
      storeSettings.hoursMonday,
      storeSettings.hoursTuesday,
      storeSettings.hoursWednesday,
      storeSettings.hoursThursday,
      storeSettings.hoursFriday,
      storeSettings.hoursSaturday,
    ];
    const schedule = schedules[pickupDateTime.getUTCDay()];
    if (!schedule || schedule === "Fermé" || !isPickupSlotOpen(schedule, pickupTime)) {
      return NextResponse.json({ error: "Ce créneau de retrait n'est pas disponible." }, { status: 400 });
    }

    // Sécurisation: Récupérer les vrais prix depuis la base de données
    const productIds = [...quantities.keys()];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Préparer les produits pour Stripe
    const lineItems = productIds.map((productId) => {
      const dbProduct = dbProducts.find((product) => product.id === productId);
      
      if (!dbProduct) {
        throw new Error(`Produit introuvable: ${productId}`);
      }

      const quantity = quantities.get(productId)!;
      if (!dbProduct.isAvailable || dbProduct.inventory < quantity) {
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
        quantity,
      };
    });

    // Stocker les infos sécurisées pour le Webhook
    const secureCartItems = productIds.map((productId) => {
      const dbProduct = dbProducts.find((product) => product.id === productId)!;
      return { 
        id: productId,
        quantity: quantities.get(productId)!,
        price: dbProduct.price,
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
  } catch (error: unknown) {
    console.error("Erreur Checkout Stripe:", error);
    return NextResponse.json({ error: "Impossible de préparer le paiement." }, { status: 500 });
  }
}
