import { Treasury } from "@/db/treasury";
import Stripe from "stripe";

export const createStripeRefund = async (
  treasury: Treasury<"stripe">,
  pi: string
): Promise<boolean> => {
  const stripe = new Stripe(treasury.sync_provider_credentials.secret_key, {
    apiVersion: "2024-10-28.acacia",
  });

  const params: Stripe.RefundCreateParams = {
    payment_intent: pi,
    reason: "requested_by_customer",
  };
  const refund = await stripe.refunds.create(params);

  return refund.status === "succeeded";
};
