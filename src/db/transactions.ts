import "server-only";

import { PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";
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

const TRANSACTION_SELECT_QUERY = `
  *,
  from_profile:a_profiles!from(*),
  to_profile:a_profiles!to(*)
`;

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

export async function getTransactionByHash(
  client: SupabaseClient,
  hash: string
): Promise<PostgrestResponse<ATransaction>> {
  return client
    .from("a_transactions")
    .select(TRANSACTION_SELECT_QUERY)
    .eq("hash", hash)
    .single();
}

export async function getTransactionsForAccount(
  client: SupabaseClient,
  account: string,
  contract?: string,
  limit?: number,
  offset?: number
): Promise<PostgrestResponse<ATransaction>> {
  let query = client
    .from("a_transactions")
    .select(TRANSACTION_SELECT_QUERY, { count: "exact" });

  if (contract) {
    query = query.eq("contract", contract);
  }

  query = query
    .or(`from.eq.${account},to.eq.${account}`)
    .order("created_at", { ascending: false });

  if (limit !== undefined && offset !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  return query;
}

export async function getNewTransactionsForAccount(
  client: SupabaseClient,
  account: string,
  fromDate: Date,
  contract?: string
): Promise<PostgrestResponse<ATransaction>> {
  let query = client.from("a_transactions").select(TRANSACTION_SELECT_QUERY);

  if (contract) {
    query = query.eq("contract", contract);
  }

  query = query
    .or(`from.eq.${account},to.eq.${account}`)
    .gt("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  return query;
}

export async function getTransactionsBetweenAccounts(
  client: SupabaseClient,
  account: string,
  withAccount: string,
  limit?: number,
  offset?: number
): Promise<PostgrestResponse<ATransaction>> {
  let query = client
    .from("a_transactions")
    .select(TRANSACTION_SELECT_QUERY, { count: "exact" })
    .or(
      `and(from.eq.${account},to.eq.${withAccount}),and(from.eq.${withAccount},to.eq.${account})`
    )
    .order("created_at", { ascending: false });

  if (limit !== undefined && offset !== undefined) {
    query = query.range(offset, offset + limit - 1);
  }

  return query;
}

export async function getNewTransactionsBetweenAccounts(
  supabase: SupabaseClient,
  account: string,
  withAccount: string,
  fromDate: Date
): Promise<(ATransaction & { exchange_direction: ExchangeDirection })[]> {
  const { data, error } = await supabase
    .from("a_transactions")
    .select(TRANSACTION_SELECT_QUERY)
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
