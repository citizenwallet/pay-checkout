"use server";

import { getServiceRoleClient } from "@/db";
import { cancelOrder } from "@/db/orders";

export const cancelOrderAction = async (orderId: number) => {
  const client = getServiceRoleClient();

  return cancelOrder(client, orderId);
};
