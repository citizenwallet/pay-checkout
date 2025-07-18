"use server";

import Stripe from "stripe";
import { getServiceRoleClient } from "@/db";
import { updateOrder, getOrder } from "@/db/orders";
import { generateCheckoutSession } from "@/stripe/checkout";
import { getTreasuryByBusinessId } from "@/db/treasury";

export const confirmPurchaseAction = async (
  accountOrUsername: string,
  orderId: number,
  total: number,
  items: { id: number; quantity: number }[]
): Promise<Stripe.Checkout.Session | { url: string } | null> => {
  const client = getServiceRoleClient();
  const { error } = await updateOrder(client, orderId, total, items);

  if (error) {
    throw new Error(error.message);
  }

  const { data: order, error: orderError } = await getOrder(client, orderId);

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order.token) {
    throw new Error("Order has no token");
  }

  const { data: treasury, error: treasuryError } =
    await getTreasuryByBusinessId(
      client,
      "stripe",
      order.place.business.id,
      order.token
    );

  if (treasuryError) {
    throw new Error(treasuryError.message);
  }

  if (!treasury) {
    throw new Error("Treasury not found");
  }

  return generateCheckoutSession(
    treasury,
    accountOrUsername,
    order.id,
    order.total
  );
};
