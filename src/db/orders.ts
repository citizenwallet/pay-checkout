import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export type OrderStatus = "pending" | "paid" | "cancelled" | "needs_minting";

export interface Order {
  id: number;
  created_at: string;
  completed_at: string | null;
  total: number;
  due: number;
  fees: number;
  place_id: number;
  items: {
    id: number;
    quantity: number;
  }[];
  status: OrderStatus;
  description: string;
  tx_hash: string | null;
  type: "web" | "app" | "terminal" | null;
  account: string | null;
}

export const createOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  account: string | null,
  type: "web" | "app" | "terminal" | "pos" | null
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: placeId,
      items,
      total,
      due: total,
      status: "pending",
      description,
      account,
      type,
    })
    .select()
    .single();
};

export const createAppOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  account: string | null,
  txHash: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: placeId,
      items,
      total,
      due: 0,
      status: "paid",
      description,
      account,
      type: "app",
      tx_hash: txHash,
    })
    .select()
    .single();
};

export const createPartnerOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: placeId,
      items,
      total,
      due: total,
      status: "pending",
      description,
      type: "web",
    })
    .select()
    .single();
};

export const createTerminalOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  fees: number,
  posId: string,
  processorTxId: number | null
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: placeId,
      items: [],
      total,
      due: 0,
      fees,
      status: "paid",
      pos: posId,
      type: "terminal",
      processor_tx: processorTxId,
    })
    .select()
    .single();
};

export const createTerminalFeeOrder = async (
  client: SupabaseClient,
  fees: number,
  description: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: 0,
      items: [],
      total: 0,
      fees,
      due: 0,
      status: "paid",
      description,
      type: "terminal",
    })
    .select()
    .single();
};

export const updateOrderTotal = async (
  client: SupabaseClient,
  placeId: number,
  orderId: number,
  total: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ place_id: placeId, total })
    .eq("id", orderId)
    .single();
};

export const updateOrder = async (
  client: SupabaseClient,
  orderId: number,
  total: number,
  items: { id: number; quantity: number }[]
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ total, items })
    .eq("id", orderId)
    .single();
};

export const getOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client.from("orders").select().eq("id", orderId).single();
};

export const getTerminalOrderByTransactionId = async (
  client: SupabaseClient,
  transactionId: string
): Promise<PostgrestResponse<Order>> => {
  return client
    .from("orders")
    .select()
    .eq("description", `Order: ${transactionId}`);
};

export const completeOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ status: "paid", due: 0, completed_at: new Date().toISOString() })
    .eq("id", orderId)
    .single();
};

export const updateOrderFees = async (
  client: SupabaseClient,
  orderId: number,
  fees: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client.from("orders").update({ fees }).eq("id", orderId).single();
};

export const cancelOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .single();
};

export const orderNeedsMinting = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ status: "needs_minting", tx_hash: null })
    .eq("id", orderId)
    .single();
};

export const attachTxHashToOrder = async (
  client: SupabaseClient,
  orderId: number,
  txHash: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ tx_hash: txHash, status: "paid" })
    .eq("id", orderId)
    .single();
};

export const attachProcessorTxToOrder = async (
  client: SupabaseClient,
  orderId: number,
  processorTxId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ processor_tx: processorTxId })
    .eq("id", orderId)
    .single();
};

export const getOrderStatus = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order["status"]>> => {
  return client.from("orders").select("status").eq("id", orderId).single();
};

export const getOrdersByPlace = async (
  client: SupabaseClient,
  placeId: number,
  limit: number = 10,
  offset: number = 0
): Promise<PostgrestResponse<Order>> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  return client
    .from("orders")
    .select()
    .eq("place_id", placeId)
    .or(
      `status.eq.paid,and(status.eq.pending,created_at.gte.${fiveMinutesAgo})`
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);
};

export const getOrdersByAccount = async (
  client: SupabaseClient,
  account: string,
  limit: number = 10,
  offset: number = 0,
  placeId?: number
): Promise<PostgrestResponse<Order>> => {
  let query = client
    .from("orders")
    .select("*", { count: "exact" })
    .eq("account", account);

  if (placeId !== undefined) {
    query = query.eq("place_id", placeId);
  }

  return query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
};

export const deleteOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client.from("orders").delete().eq("id", orderId).select().single();
};
