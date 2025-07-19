import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface TreasuryAccountMessage {
  message: string;
  treasury_id: number;
  created_at: string;
  account: string;
}

export const getTreasuryAccountMessage = async (
  client: SupabaseClient,
  message: string,
  treasuryId: number
): Promise<PostgrestSingleResponse<TreasuryAccountMessage | null>> => {
  return client
    .from("treasury_account_message")
    .select("*")
    .eq("message", message)
    .eq("treasury_id", treasuryId)
    .maybeSingle();
};
