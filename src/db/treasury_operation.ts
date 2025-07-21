import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { SyncStrategy } from "./treasury";

export type TreasuryOperationStatus =
  | "requesting"
  | "pending"
  | "pending-periodic"
  | "confirming"
  | "processed"
  | "processed-account-not-found";

export interface PeriodicOperationMetadata {
  grouped_operations: string[];
  total_amount: number;
}

export interface PaygOperationMetadata {
  order_id?: number;
  description?: string;
}

export interface TreasuryOperation<S extends SyncStrategy = "payg"> {
  id: string;
  treasury_id: number;
  created_at: string;
  updated_at: string;
  direction: "in" | "out";
  amount: number;
  status: TreasuryOperationStatus;
  message: string;
  metadata: S extends "periodic"
    ? PeriodicOperationMetadata
    : S extends "payg"
    ? PaygOperationMetadata
    : Record<string, string>;
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

export const getPendingPeriodicTreasuryOperations = async (
  client: SupabaseClient,
  treasuryId: number,
  minDate: string,
  maxDate: string
): Promise<PostgrestResponse<TreasuryOperation<"periodic">>> => {
  return client
    .from("treasury_operations")
    .select("*")
    .eq("treasury_id", treasuryId)
    .eq("status", "pending-periodic")
    .neq("account", null)
    .gte("created_at", minDate)
    .lt("created_at", maxDate)
    .order("created_at", { ascending: false });
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

export const processPeriodicTreasuryOperation = async (
  client: SupabaseClient,
  id: string,
  treasuryId: number,
  groupedOperations: string[],
  totalAmount: number
): Promise<PostgrestSingleResponse<null>> => {
  return client
    .from("treasury_operations")
    .update({
      status: "pending",
      metadata: {
        grouped_operations: groupedOperations,
        total_amount: totalAmount,
      },
    })
    .eq("id", id)
    .eq("treasury_id", treasuryId);
};
