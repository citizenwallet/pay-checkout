import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkoutSessionCompleted } from "./checkoutSessionCompleted";
import { chargeUpdated } from "./chargeUpdated";

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
  switch (event.type) {
    case "checkout.session.completed":
      await checkoutSessionCompleted(event);
      break;
    case "charge.updated":
      await chargeUpdated(stripe, event);
      break;
  }

  return NextResponse.json({ received: true });
}
