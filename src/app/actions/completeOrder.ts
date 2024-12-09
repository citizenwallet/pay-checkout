"use server";

import { getServiceRoleClient } from "@/db";
import { completeOrder, Order } from "@/db/orders";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

export const completeOrderAction = async (
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  const client = getServiceRoleClient();

  return completeOrder(client, orderId);
};
