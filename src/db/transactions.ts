import "server-only";

import { SupabaseClient } from "@supabase/supabase-js";
import { AProfile } from "./profiles";

export interface ATransaction {
  id: string;
  hash: string;
  created_at: string;
  updated_at: string;
  from: string;
  to: string;
  value: string;
  description: string;
  status: string;
}

export type ExchangeDirection = "sent" | "received"; // to denote '+' or '-' value

export async function getProfileMapFromTransactionHashes(
  supabase: SupabaseClient,
  hashes: string[]
): Promise<{ [key: string]: AProfile }> {
  const { data } = await supabase
    .from("a_transactions")
    .select(
      `
      *,
      from_profile:a_profiles!Transactions_from_fkey(*)
    `
    )
    .in("hash", hashes);

  if (!data) return {};
  return data.reduce((acc, row) => {
    acc[row.hash] = row.from_profile as AProfile;
    return acc;
  }, {} as { [key: string]: AProfile });
}

export async function getTransactionsBetweenAccounts(
  supabase: SupabaseClient,
  account: string,
  withAccount: string
): Promise<(ATransaction & { exchange_direction: ExchangeDirection })[]> {
  const { data, error } = await supabase
    .from("a_transactions")
    .select("*")
    .or(
      `and(from.eq.${account},to.eq.${withAccount}),and(from.eq.${withAccount},to.eq.${account})`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const transformedData: (ATransaction & {
    exchange_direction: ExchangeDirection;
  })[] = data.map((transaction) => {
    return {
      ...transaction,
      exchange_direction: transaction.from === account ? "sent" : "received",
    };
  });

  return transformedData;
}
