"use server";

import { getServiceRoleClient } from "@/db";
import { getItemsForPlace } from "@/db/items";
import { createOrder } from "@/db/orders";
import { ActionResponse } from ".";

export async function generateOrder(
  placeId: number,
  items: { [key: number]: number },
  description: string,
  total: number,
  account: string | null,
  type: "web" | "app" | "terminal" | "pos" | null
): Promise<ActionResponse<number>> {
  const client = getServiceRoleClient();

  // check if items exist
  const { data, error } = await getItemsForPlace(client, placeId);
  if (error) {
    return { error: error.message };
  }

  // check if items are valid
  const validItems = data?.filter((item) => items[item.id]);
  if (validItems.length !== Object.keys(items).length) {
    return { error: "Invalid items" };
  }

  // create order
  const { data: orderData, error: orderError } = await createOrder(
    client,
    placeId,
    total,
    validItems.map((item) => ({ id: item.id, quantity: items[item.id] })),
    description,
    account,
    type
  );
  if (orderError) {
    return { error: orderError.message };
  }

  return { data: orderData.id };
}
