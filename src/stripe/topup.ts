import "server-only";

import { getServiceRoleClient } from "@/db";
import { completeOrder } from "@/db/orders";
import { getPlace } from "@/lib/place";

import Stripe from "stripe";

export const generateTopUpCheckoutSession = async (
  account: string,
  accountOrUsername: string,
  orderId: number,
  amount: number,
  closeUrl?: string
) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const stripe = new Stripe(secretKey);
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID is not set");
  }

  const baseDomain = process.env.BASE_DOMAIN;
  if (!baseDomain) {
    throw new Error("BASE_DOMAIN is not set");
  }

  const client = getServiceRoleClient();

  const { place } = await getPlace(client, accountOrUsername);

  if (!place) {
    throw new Error("Place not found");
  }

  const demoCheckoutSlugs = process.env.DEMO_CHECKOUT_SLUGS?.split(",") ?? [];
  if (demoCheckoutSlugs.includes(place.slug)) {
    // demo checkout does not need to go through stripe
    // wait 1 second to simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // set order to paid
    const { error } = await completeOrder(client, orderId);
    if (error) {
      throw new Error("Error completing order");
    }

    return {
      url: `https://${baseDomain}/${accountOrUsername}/pay/${orderId}/success`,
    };
  }

  const metadata: Stripe.MetadataParam = {
    account,
    placeName: place.name,
    placeId: place.id,
    orderId,
    amount,
  };

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: amount,
    },
  ];

  const successUrl =
    closeUrl ??
    `https://${baseDomain}/${accountOrUsername}/pay/${orderId}/success`;
  const cancelUrl =
    closeUrl ?? `https://${baseDomain}/${accountOrUsername}/pay/${orderId}`;

  const request: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: account,
    line_items,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: {
      metadata,
    },
  };

  return stripe.checkout.sessions.create(request);
};
