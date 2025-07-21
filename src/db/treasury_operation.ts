import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export type TreasuryOperationStatus =
  | "requesting"
  | "pending"
  | "confirming"
  | "processed"
  | "processed-account-not-found";

export interface TreasuryOperation {
  id: string;
  treasury_id: number;
  created_at: string;
  direction: "in" | "out";
  amount: number;
  status: TreasuryOperationStatus;
  message: string;
  metadata: Record<string, string>;
  tx_hash: string | null;
  account: string | null;
}

export const insertTreasuryOperations = async (
  client: SupabaseClient,
  operations: TreasuryOperation[]
): Promise<PostgrestSingleResponse<null>> => {
  return client.from("treasury_operations").upsert(operations, {
    onConflict: "id,treasury_id",
    ignoreDuplicates: true,
  });
};

export const getPendingTreasuryOperations = async (
  client: SupabaseClient,
  treasuryId: number,
  limit: number = 100,
  offset: number = 0
): Promise<PostgrestResponse<TreasuryOperation[]>> => {
  return client
    .from("treasury_operations")
    .select("*")
    .eq("treasury_id", treasuryId)
    .eq("status", "pending")
    .neq("account", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
};

export const getLatestTreasuryOperation = async (
  client: SupabaseClient,
  treasuryId: number
): Promise<PostgrestSingleResponse<TreasuryOperation | null>> => {
  return client
    .from("treasury_operations")
    .select("*")
    .eq("treasury_id", treasuryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
};
