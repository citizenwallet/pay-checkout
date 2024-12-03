import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export interface AProfile {
  created_at: string; // timestamp with time zone
  account: string; // text
  username: string; // text
  name: string; // text
  description: string; // text
  image: string; // text
  image_medium: string; // text
  image_small: string; // text
  token_id: string; // text
  updated_at: string; // timestamp without time zone
  place_id: bigint; // bigint
}

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<PostgrestSingleResponse<AProfile>> {
  return supabase
    .from("a_profiles")
    .select("*")
    .eq("username", username)
    .neq("token_id", null)
    .neq("token_id", "")
    .single();
}

export async function getProfilesByAccounts(
  supabase: SupabaseClient,
  accounts: string[]
): Promise<PostgrestResponse<AProfile>> {
  return supabase
    .from("a_profiles")
    .select("*")
    .in("account", accounts)
    .neq("token_id", null)
    .neq("token_id", "");
}
