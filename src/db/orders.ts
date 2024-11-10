import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface Order {
  id: number;
  created_at: string;
  completed_at: string | null;
  total: number;
  due: number;
  place_id: number;
  items: {
    id: number;
    quantity: number;
  }[];
  status: "pending" | "paid" | "cancelled";
}

export const createOrder = async (
  client: SupabaseClient,
  placeId: number,
  total: number,
  items: { id: number; quantity: number }[]
): Promise<PostgrestSingleResponse<Order>> => {
  return client
    .from("orders")
    .insert({ place_id: placeId, items, total, due: total, status: "pending" })
    .select()
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

export const getOrderStatus = async (
  client: SupabaseClient,
  orderId: number
): Promise<PostgrestSingleResponse<Order["status"]>> => {
  return client.from("orders").select("status").eq("id", orderId).single();
};
