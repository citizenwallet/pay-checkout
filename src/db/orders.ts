import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Item } from "./items";

export type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "needs_minting"
  | "needs_burning"
  | "refunded"
  | "refund_pending"
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
  type: "web" | "app" | "terminal" | "system" | null;
  account: string | null;
  payout_id: number | null;
  pos: string | null;
  processor_tx: number | null;
  refund_id: number | null;
  token: string | null;
}

export interface OrderWithPlaceMetadata extends Order {
  place: {
    display: string;
    accounts: string[];
    slug: string;
  };
}

export interface OrderWithBusiness extends Order {
  place: {
    display: string;
    accounts: string[];
    slug: string;
    business: {
      id: number;
    };
    items: Item[];
  };
}

const ORDER_SELECT_QUERY = `
  *,
  place:places!inner(display, accounts, slug, items:pos_items(id,place_id,name,description,image,price,vat,category,order,hidden))
`;

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
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
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
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
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
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const completeAppOrder = async (
  client: SupabaseClient,
  orderId: number,
  account: string,
  txHash: string
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ status: "paid", due: 0, account, tx_hash: txHash })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const createPartnerOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[],
  description: string,
  token: string
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
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
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const updateOrderTotal = async (
  client: SupabaseClient,
  placeId: number,
  orderId: number,
  total: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ place_id: placeId, total })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const updateOrder = async (
  client: SupabaseClient,
  orderId: number,
  total: number,
  items: { id: number; quantity: number }[]
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ total, items })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const getOrderWithBusiness = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithBusiness>> => {
  return client
    .from("orders")
    .select("*, place:places(display, accounts, slug, business:businesses(id))")
    .eq("id", orderId)
    .single();
};

export const getOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .select(ORDER_SELECT_QUERY)
    .eq("id", orderId)
    .single();
};

export const getTerminalOrderByTransactionId = async (
  client: SupabaseClient,
  transactionId: string
): Promise<PostgrestResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .select(ORDER_SELECT_QUERY)
    .eq("description", `Order: ${transactionId}`);
};

export const getOrderByProcessorTxId = async (
  client: SupabaseClient,
  processorTxId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .select(ORDER_SELECT_QUERY)
    .eq("processor_tx", processorTxId)
    .single();
};

export const completeOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ status: "paid", due: 0, completed_at: new Date().toISOString() })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const completePosOrder = async (
  client: SupabaseClient,
  orderId: number,
  txHash: string,
  account: string
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
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
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const refundOrder = async (
  client: SupabaseClient,
  orderId: number,
  amount: number,
  fees: number,
  processorTxId: number | null,
  status: OrderStatus = "refund"
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata | null>> => {
  const orderResponse = await getOrderWithBusiness(client, orderId);
  const { data: order, error } = orderResponse;
  if (error) {
    throw new Error(error.message);
  }

  if (order.status === "refunded") {
    return orderResponse;
  }

  const newOrder: Omit<
    Order,
    "id" | "created_at" | "completed_at" | "tx_hash" | "refund_id"
  > = {
    place_id: order.place_id,
    items: order.items,
    total: amount,
    fees,
    due: 0,
    status,
    description: order.description,
    type: order.type,
    payout_id: order.payout_id,
    pos: order.pos,
    processor_tx: processorTxId,
    token: order.token,
    account: order.account,
  };

  const result = await client
    .from("orders")
    .insert(newOrder)
    .select(ORDER_SELECT_QUERY)
    .maybeSingle();

  const { data: refundOrder, error: refundOrderError } = result;
  const refundOrderId: number | null = refundOrder?.id;

  if (refundOrderError === null && refundOrderId !== null) {
    const { error: updatedOrderError } = await client
      .from("orders")
      .update({ status: "refunded", refund_id: refundOrderId })
      .eq("id", orderId);

    console.error("updatedOrderError", updatedOrderError);
  }

  return result;
};

export const updateOrderFees = async (
  client: SupabaseClient,
  orderId: number,
  fees: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ fees })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const cancelOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const orderNeedsBurning = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ status: "needs_burning" })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const attachTxHashToOrder = async (
  client: SupabaseClient,
  orderId: number,
  txHash: string
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ tx_hash: txHash, status: "paid" })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};

export const attachProcessorTxToOrder = async (
  client: SupabaseClient,
  orderId: number,
  processorTxId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .update({ processor_tx: processorTxId })
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
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
): Promise<PostgrestResponse<OrderWithPlaceMetadata>> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  return client
    .from("orders")
    .select(ORDER_SELECT_QUERY, { count: "exact" })
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
  placeId?: number,
  slug?: string,
  token?: string
): Promise<PostgrestResponse<OrderWithPlaceMetadata>> => {
  let query = client
    .from("orders")
    .select(ORDER_SELECT_QUERY, { count: "exact" })
    .in("account", account);

  if (placeId !== undefined) {
    query = query.eq("place_id", placeId);
  }

  if (slug !== undefined) {
    query = query.eq("place.slug", slug);
  }

  if (token !== undefined) {
    query = query.eq("token", token);
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
): Promise<PostgrestResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .select(ORDER_SELECT_QUERY, { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
};

export const deleteOrder = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<OrderWithPlaceMetadata>> => {
  return client
    .from("orders")
    .delete()
    .eq("id", orderId)
    .select(ORDER_SELECT_QUERY)
    .single();
};
