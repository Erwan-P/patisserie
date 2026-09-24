import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendReceiptEmail } from "@/lib/email";
import { fulfillCheckoutSession } from "@/lib/order-fulfillment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    console.error("Webhook signature verification failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const result = await fulfillCheckoutSession(session);
      if (result.created) {
        try {
          await sendReceiptEmail(result.order, result.pickupDate, result.pickupTime);
        } catch (emailError) {
          console.error("Erreur d'envoi de l'email de commande:", emailError);
        }
      }
      
      console.log(`Commande ${result.order.id} validée avec succès via Webhook.`);
    } catch (err: unknown) {
      console.error("Erreur lors du traitement de la commande:", err);
      // Retourner une erreur 500 indique à Stripe de réessayer plus tard
      return NextResponse.json({ error: "Erreur interne au traitement" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
