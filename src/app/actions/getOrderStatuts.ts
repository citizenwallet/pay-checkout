"use server";

import { getServiceRoleClient } from "@/db";

export const getOrderStatus = async (orderId: number) => {
  const client = getServiceRoleClient();

  return client.from("orders").select("status").eq("id", orderId).single();
};
