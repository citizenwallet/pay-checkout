import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface TreasuryAccount {
  id: string;
  treasury_id: number;
  created_at: string;
  account: string;
}

export const getTreasuryAccount = async (
  client: SupabaseClient,
  id: string,
  treasuryId: number
): Promise<PostgrestSingleResponse<TreasuryAccount | null>> => {
  return client
    .from("treasury_account")
    .select("*")
    .eq("id", id)
    .eq("treasury_id", treasuryId)
    .maybeSingle();
};
