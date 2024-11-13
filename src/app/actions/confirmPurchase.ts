"use server";

import Stripe from "stripe";
import { getServiceRoleClient } from "@/db";
import { updateOrder, getOrder } from "@/db/orders";
import { generateCheckoutSession } from "@/stripe/checkout";

export const confirmPurchase = async (
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

  return generateCheckoutSession(accountOrUsername, order.id, order.total);
};
