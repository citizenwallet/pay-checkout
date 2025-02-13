"use server";

import Stripe from "stripe";
import { getServiceRoleClient } from "@/db";
import { updateOrder, getOrder } from "@/db/orders";
import { generateTopUpCheckoutSession } from "@/stripe/topup";

export const confirmTopUpAction = async (
  account: string,
  accountOrUsername: string,
  orderId: number,
  total: number,
  closeUrl?: string
): Promise<Stripe.Checkout.Session | { url: string } | null> => {
  const client = getServiceRoleClient();
  const { error } = await updateOrder(client, orderId, total, []);

  if (error) {
    throw new Error(error.message);
  }

  const { data: order, error: orderError } = await getOrder(client, orderId);

  if (orderError) {
    throw new Error(orderError.message);
  }

  return generateTopUpCheckoutSession(
    account,
    accountOrUsername,
    order.id,
    order.total,
    closeUrl
  );
};
