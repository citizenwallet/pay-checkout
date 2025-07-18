import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkoutSessionCompleted } from "./checkoutSessionCompleted";
import { chargeUpdated } from "./chargeUpdated";
import { paymentIntentSucceeded } from "./paymentIntentSucceeded";
import { chargeRefunded } from "./chargeRefunded";
import { getTreasury } from "@/db/treasury";
import { getServiceRoleClient } from "@/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ treasuryId: string }> }
) {
  const { treasuryId } = await params;

  const client = getServiceRoleClient();

  const { data: treasury, error: treasuryError } = await getTreasury(
    client,
    parseInt(treasuryId),
    "stripe"
  );

  if (treasuryError) {
    return NextResponse.json({ error: treasuryError.message }, { status: 500 });
  }

  if (!treasury) {
    return NextResponse.json({ error: "Treasury not found" }, { status: 404 });
  }

  const stripe = new Stripe(treasury.sync_provider_credentials.secret_key);

  // This is your Stripe webhook secret for testing your endpoint locally.
  const endpointSecret = treasury.sync_provider_credentials.webhook_secret;

  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

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
