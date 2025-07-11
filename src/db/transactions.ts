import "server-only";

import { SupabaseClient } from "@supabase/supabase-js";
import { AProfile } from "./profiles";

export interface ATransaction {
  id: string;
  hash: string;
  contract: string;
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
  hashes: string[],
  direction: "from" | "to" = "from"
): Promise<{ [key: string]: AProfile }> {
  const { data } = await supabase
    .from("a_transactions")
    .select(
      `
      *,
      ${direction}_profile:a_profiles!Transactions_${direction}_fkey(*)
    `
    )
    .in("hash", hashes);

  if (!data) return {};
  return data.reduce((acc, row) => {
    acc[row.hash] = row[`${direction}_profile`] as AProfile;
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

export async function getNewTransactionsBetweenAccounts(
  supabase: SupabaseClient,
  account: string,
  withAccount: string,
  fromDate: Date
): Promise<(ATransaction & { exchange_direction: ExchangeDirection })[]> {
  const { data, error } = await supabase
    .from("a_transactions")
    .select("*")
    .or(
      `and(from.eq.${account},to.eq.${withAccount}),and(from.eq.${withAccount},to.eq.${account})`
    )
    .gte("created_at", fromDate.toISOString())
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
