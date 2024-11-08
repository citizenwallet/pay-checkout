import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export interface Place {
  id: string;
  created_at: string;
  business_id: string;
  slug: string;
  name: string;
  accounts: string[];
}

export const getPlaceByUsername = async (
  client: SupabaseClient,
  username: string
): Promise<PostgrestSingleResponse<Place | null>> => {
  return client.from("places").select("*").eq("slug", username).maybeSingle();
};

export const getPlacesByAccount = async (
  client: SupabaseClient,
  account: string
): Promise<PostgrestResponse<Place>> => {
  return client
    .from("places")
    .select("*")
    .contains("accounts", JSON.stringify([account]));
};
