import "server-only";

import Stripe from "stripe";

export const generateCheckoutSession = async (
  accountOrUsername: string,
  account: string,
  orderId: number,
  amount: number
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

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: priceId,
      quantity: amount,
    },
  ];

  const baseDomain = process.env.BASE_DOMAIN;
  if (!baseDomain) {
    throw new Error("BASE_DOMAIN is not set");
  }

  const metadata: Stripe.MetadataParam = {
    account,
    orderId,
    amount,
    forward_url: `https://${baseDomain}/api/v1/webhooks/stripe`,
  };

  const request: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: account,
    line_items,
    mode: "payment",
    success_url: `https://${baseDomain}/${accountOrUsername}/pay/${orderId}/success`,
    cancel_url: `https://${baseDomain}/${accountOrUsername}/pay/${orderId}`,
    metadata,
  };

  return stripe.checkout.sessions.create(request);
};
