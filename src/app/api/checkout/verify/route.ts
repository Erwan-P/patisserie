import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "Session ID manquant." }, { status: 400 });
    }

    // 1. Vérifier si le webhook a déjà créé la commande
    const existingOrder = await prisma.order.findUnique({
      where: { id: session_id }
    });

    if (existingOrder) {
      return NextResponse.json({ success: true, orderId: existingOrder.id });
    }

    // 2. Le webhook n'a pas encore créé la commande.
    //    On vérifie directement auprès de Stripe si le paiement est OK.
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    if (checkoutSession.payment_status !== "paid") {
      // Le paiement n'est pas encore confirmé, on attend
      return NextResponse.json({ success: false, status: "processing" });
    }

    // 3. Le paiement est confirmé par Stripe ! On crée la commande nous-mêmes
    //    (le webhook ne l'a pas fait, probablement à cause de Smee en dev)
    const { userId, pickupDate, pickupTime, cartItems } = checkoutSession.metadata as any;
    
    if (!userId || !cartItems) {
      return NextResponse.json({ error: "Métadonnées de session incomplètes." }, { status: 400 });
    }

    const items = JSON.parse(cartItems);
    const total = checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0;

    // Combine date and time
    const datePart = new Date(pickupDate).toISOString().split('T')[0];
    const finalPickupDate = new Date(`${datePart}T${pickupTime}:00`);

    // Revérifier qu'un autre appel concurrent n'a pas créé la commande entre-temps
    const doubleCheck = await prisma.order.findUnique({ where: { id: session_id } });
    if (doubleCheck) {
      return NextResponse.json({ success: true, orderId: doubleCheck.id });
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        id: session_id,
        userId: userId,
        status: "PAID",
        total: total,
        pickupDate: finalPickupDate,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
      include: { items: { include: { product: true } }, user: true }
    });

    // Mettre à jour le stock et les ventes
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          inventory: { decrement: item.quantity },
          sales: { increment: item.quantity }
        }
      });
    }

    // Envoyer l'email de confirmation
    try {
      await sendReceiptEmail(order, pickupDate, pickupTime);
    } catch (emailErr) {
      console.error("Erreur envoi email (commande créée quand même):", emailErr);
    }

    console.log(`Commande ${order.id} validée via vérification directe Stripe.`);
    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    // Si c'est une erreur Prisma de contrainte unique (P2002), la commande existe déjà
    if (error.code === "P2002") {
      return NextResponse.json({ success: true, orderId: "already_created" });
    }
    console.error("Verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
