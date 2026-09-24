import { NextResponse } from "next/server";
import { sendReceiptEmail } from "@/lib/email";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fulfillCheckoutSession } from "@/lib/order-fulfillment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "Session ID manquant." }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    if (checkoutSession.metadata?.userId !== authSession.user.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    if (checkoutSession.payment_status !== "paid") {
      // Le paiement n'est pas encore confirmé, on attend
      return NextResponse.json({ success: false, status: "processing" });
    }

    const result = await fulfillCheckoutSession(checkoutSession);

    // Envoyer l'email de confirmation
    try {
      if (result.created) {
        await sendReceiptEmail(result.order, result.pickupDate, result.pickupTime);
      }
    } catch (emailErr) {
      console.error("Erreur envoi email (commande créée quand même):", emailErr);
    }

    console.log(`Commande ${result.order.id} validée via vérification directe Stripe.`);
    return NextResponse.json({ success: true, orderId: result.order.id });

  } catch (error: unknown) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Impossible de vérifier la commande." }, { status: 500 });
  }
}
