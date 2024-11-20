import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface Business {
  id: number;
  created_at: string;
  name: string | null;
  status: string | null;
  vat_number: string | null;
  business_status: string | null;
  account: string | null;
  invite_code: string | null;
}

export const getBusinessByInviteCode = async (
  client: SupabaseClient,
  inviteCode: string
): Promise<PostgrestSingleResponse<Business | null>> => {
  return client
    .from("businesses")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();
};
