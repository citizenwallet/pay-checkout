import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkoutSessionCompleted } from "./checkoutSessionCompleted";
import { chargeUpdated } from "./chargeUpdated";
import { paymentIntentSucceeded } from "./paymentIntentSucceeded";
import { chargeRefunded } from "./chargeRefunded";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }
  console.log("Event:", event);
  switch (event.type) {
    case "checkout.session.completed":
      return checkoutSessionCompleted(event);
    case "payment_intent.succeeded":
      return paymentIntentSucceeded(event);
    case "charge.updated":
      return chargeUpdated(stripe, event);
    case "charge.refunded":
      return chargeRefunded(stripe, event);
  }

  return NextResponse.json({ received: true });
}
