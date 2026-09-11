import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Vérifier si la commande existe déjà pour éviter les doublons
    const existingOrder = await prisma.order.findUnique({
      where: { id: session.id },
    });

    if (existingOrder) {
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    try {
      // Process metadata
      const { userId, pickupDate, pickupTime, cartItems } = session.metadata as any;
      const items = JSON.parse(cartItems);
      
      const total = session.amount_total ? session.amount_total / 100 : 0;

      // Combine date and time en évitant tout décalage UTC
      const [year, month, day] = pickupDate.split('-').map(Number);
      const finalPickupDate = new Date(year, month - 1, day, ...pickupTime.split(':').map(Number));

      // Create Order with Stripe session_id as the order ID
      const order = await prisma.order.create({
        data: {
          id: session.id,
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

      // Update inventory and sales
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.id },
          data: {
            inventory: { decrement: item.quantity },
            sales: { increment: item.quantity }
          }
        });
      }

      // Send email
      await sendReceiptEmail(order, pickupDate, pickupTime);
      
      console.log(`Commande ${order.id} validée avec succès via Webhook.`);
    } catch (err: any) {
      console.error("Erreur lors du traitement de la commande:", err);
      // Retourner une erreur 500 indique à Stripe de réessayer plus tard
      return NextResponse.json({ error: "Erreur interne au traitement" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
