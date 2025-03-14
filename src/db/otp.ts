import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface Otp {
  source: string;
  created_at: string;
  expires_at: string;
  code: string;
  type: string;
}

export const createOtp = async (
  client: SupabaseClient,
  email: string,
  otp: string
): Promise<PostgrestSingleResponse<Otp | null>> => {
  return client
    .from("otp")
    .upsert(
      {
        source: email,
        code: otp,
        type: "email",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      },
      {
        onConflict: "source",
      }
    )
    .select("*")
    .maybeSingle();
};
