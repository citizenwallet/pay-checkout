"use server";

import { getServiceRoleClient } from "@/db";
import { updateOrder, getOrderWithBusinessAccount } from "@/db/orders";
import { generateCheckoutSession } from "@/stripe/checkout";

export const confirmPurchase = async (
  accountOrUsername: string,
  orderId: number,
  total: number,
  items: { id: number; quantity: number }[]
) => {
  const client = getServiceRoleClient();
  const { error } = await updateOrder(client, orderId, total, items);

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: orderWithBusinessAccount,
    error: orderWithBusinessAccountError,
  } = await getOrderWithBusinessAccount(client, orderId);

  if (orderWithBusinessAccountError) {
    throw new Error(orderWithBusinessAccountError.message);
  }

  return generateCheckoutSession(
    accountOrUsername,
    orderWithBusinessAccount.business_account,
    orderWithBusinessAccount.id,
    orderWithBusinessAccount.total
  );
};
