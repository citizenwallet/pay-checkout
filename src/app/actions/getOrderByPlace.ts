"use server";

import { getServiceRoleClient } from "@/db";
import { getOrdersByPlace } from "@/db/orders";

export const getOrderByPlaceAction = async (
  placeId: number,
  limit: number = 10,
  offset: number = 0
) => {
  const client = getServiceRoleClient();

  return await getOrdersByPlace(client, placeId, limit, offset);
};
