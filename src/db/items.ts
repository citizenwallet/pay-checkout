import "server-only";

import { PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";

export interface Item {
  id: number;
  created_at: string;
  place_id: number;
  name: string;
  description: string;
  image?: string;
  price: number;
  vat: number;
  category: string;
}

export const getItemsForPlace = async (
  client: SupabaseClient,
  placeId: number
): Promise<PostgrestResponse<Item>> => {
  return client
    .from("pos_items")
    .select("*")
    .eq("place_id", placeId)
    .order("order", { ascending: true });
};
