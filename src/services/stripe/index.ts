import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-10-28.acacia",
});

export const createStripeRefund = async (pi: string): Promise<boolean> => {
  const params: Stripe.RefundCreateParams = {
    payment_intent: pi,
    reason: "requested_by_customer",
  };
  const refund = await stripe.refunds.create(params);

  return refund.status === "succeeded";
};
