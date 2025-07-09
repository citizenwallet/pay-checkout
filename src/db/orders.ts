import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "needs_minting"
  | "needs_burning"
  | "refunded"
  | "refund"
  | "correction";

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
  payout_id: number | null;
  pos: string | null;
  processor_tx: number | null;
  refund_id: number | null;
  token: string | null;
}

export const createOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  account: string | null,
  type: "web" | "app" | "terminal" | "pos" | null = null,
  posId: string | null = null,
  token: string
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
      pos: posId,
      token,
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
  txHash: string,
  token: string
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
      token,
    })
    .select()
    .single();
};

export const createPosOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  account: string | null,
  posId: string | null = null,
  txHash: string | null = null,
  token: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({
      place_id: placeId,
      items,
      total,
      due: 0,
      status: "pending",
      description,
      account,
      type: "pos",
      pos: posId,
      tx_hash: txHash,
      token,
    })
    .select()
    .single();
};

export const completeAppOrder = async (
  client: SupabaseClient,
  orderId: number,
  account: string,
  txHash: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ status: "paid", due: 0, account, tx_hash: txHash })
    .eq("id", orderId)
    .select()
    .single();
};

export const createPartnerOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  token: string
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
      token,
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
  processorTxId: number | null,
  token: string
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
      token,
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

export const getOrderByProcessorTxId = async (
  client: SupabaseClient,
  processorTxId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .select()
    .eq("processor_tx", processorTxId)
    .single();
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

export const completePosOrder = async (
  client: SupabaseClient,
  orderId: number,
  txHash: string,
  account: string
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({
      status: "paid",
      due: 0,
      completed_at: new Date().toISOString(),
      tx_hash: txHash,
      account,
    })
    .eq("id", orderId)
    .select()
    .single();
};

export const refundOrder = async (
  client: SupabaseClient,
  orderId: number,
  amount: number,
  fees: number,
  processorTxId: number | null
): Promise<PostgrestSingleResponse<Order>> => {
  const orderResponse = await getOrder(client, orderId);
  const { data: order, error } = orderResponse;
  if (error) {
    throw new Error(error.message);
  }

  if (order.status === "refunded") {
    return orderResponse;
  }

  const { data: refundOrder, error: refundOrderError } = await client
    .from("orders")
    .insert({
      place_id: order.place_id,
      items: order.items,
      total: amount,
      fees,
      due: 0,
      status: "refund",
      description: order.description,
      type: order.type,
      payout_id: order.payout_id,
      pos: order.pos,
      processor_tx: processorTxId,
      token: order.token,
    })
    .select()
    .single();
  const refundOrderId: number | null = refundOrder?.id;

  if (refundOrderError === null && refundOrderId !== null) {
    const { error: updatedOrderError } = await client
      .from("orders")
      .update({ status: "refunded", refund_id: refundOrderId })
      .eq("id", orderId);

    console.error("updatedOrderError", updatedOrderError);
  }

  return refundOrder;
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

export const orderNeedsBurning = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .update({ status: "needs_burning" })
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
      `status.in.(paid,refunded,needs_minting),and(status.eq.pending,created_at.gte.${fiveMinutesAgo})`
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);
};

export const getTodayOrdersByPlaceByPosId = async (
  client: SupabaseClient,
  placeId: number,
  posId: string,
  tokenAddress: string
): Promise<PostgrestResponse<Order>> => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toISOString();
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  ).toISOString();

  return client
    .from("orders")
    .select()
    .eq("place_id", placeId)
    .eq("pos", posId)
    .eq("token", tokenAddress)
    .gte("created_at", startOfDay)
    .lt("created_at", endOfDay)
    .or(`status.in.(paid,refunded,needs_minting)`)
    .order("created_at", { ascending: false });
};

export const getOrdersByAccount = async (
  client: SupabaseClient,
  account: string[],
  limit: number = 10,
  offset: number = 0,
  placeId?: number
): Promise<PostgrestResponse<Order>> => {
  let query = client
    .from("orders")
    .select("*", { count: "exact" })
    .contains("account", account);

  if (placeId !== undefined) {
    query = query.eq("place_id", placeId);
  }

  return query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
};

export const getOrdersByStatus = async (
  client: SupabaseClient,
  status: OrderStatus,
  limit: number = 10,
  offset: number = 0
): Promise<PostgrestResponse<Order>> => {
  return client
    .from("orders")
    .select()
    .eq("status", status)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
};

export const deleteOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order>> => {
  return client.from("orders").delete().eq("id", orderId).select().single();
};
