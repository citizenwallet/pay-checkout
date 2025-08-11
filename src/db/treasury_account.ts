import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";
import { idToStructuredMessage } from "@/services/ponto/transaction";

export interface TreasuryAccount {
  id: string;
  treasury_id: number;
  created_at: string;
  account: string;
  target: number | null;
  name: string | null;
}

export const createTreasuryAccount = async (
  client: SupabaseClient,
  id: string,
  treasuryId: number,
  account: string,
  target: number | null,
  name: string | null
): Promise<PostgrestSingleResponse<TreasuryAccount | null>> => {
  return client
    .from("treasury_account")
    .insert({ id, treasury_id: treasuryId, account, target, name });
};

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

export const getTreasuryAccountTarget = async (
  client: SupabaseClient,
  treasuryId: number,
  account: string
): Promise<PostgrestSingleResponse<number | null>> => {
  return client
    .from("treasury_account")
    .select("target")
    .eq("treasury_id", treasuryId)
    .eq("account", account)
    .maybeSingle();
};

export const getTreasuryAccountByAccount = async (
  client: SupabaseClient,
  treasuryId: number,
  account: string
): Promise<PostgrestSingleResponse<TreasuryAccount | null>> => {
  return client
    .from("treasury_account")
    .select("*")
    .eq("treasury_id", treasuryId)
    .eq("account", account)
    .maybeSingle();
};

export const getLargestTreasuryAccountId = async (
  client: SupabaseClient,
  treasuryId: number
): Promise<PostgrestSingleResponse<{ id: string } | null>> => {
  return client
    .from("treasury_account")
    .select("id")
    .eq("treasury_id", treasuryId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
};

export const getNextTreasuryAccountId = async (
  client: SupabaseClient,
  treasuryId: number
): Promise<string> => {
  const { data: largestIdResult, error } = await getLargestTreasuryAccountId(
    client,
    treasuryId
  );

  if (error) {
    throw error;
  }

  if (!largestIdResult) {
    // If no existing accounts, start with ID 1
    return idToStructuredMessage(1);
  }

  // Extract the numeric part from the largest ID (remove the checksum)
  const numericPart = largestIdResult.id.substring(0, 10);
  const currentNumber = parseInt(numericPart, 10);

  // Increment by 1 and format with checksum
  return idToStructuredMessage(currentNumber + 1);
};
