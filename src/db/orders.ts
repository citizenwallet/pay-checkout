import { SupabaseClient } from "@supabase/supabase-js";

import { PostgrestResponse } from "@supabase/supabase-js";
import { Item } from "./items";

export const getItemsForPlace = async (
  client: SupabaseClient,
  placeId: number
): Promise<PostgrestResponse<Item>> => {
  console.log("getItemsForPlace", placeId);
  return client
    .from("pos_items")
    .select("*")
    .eq("place_id", placeId)
    .order("order", { ascending: true });
};
