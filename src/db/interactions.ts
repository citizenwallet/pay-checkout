import "server-only";
import { ATransaction, ExchangeDirection } from "./transactions";
import { AProfile } from "./profiles";
import { Place } from "./places";
import { SupabaseClient } from "@supabase/supabase-js";

export interface AInteraction {
  id: string; // uuid becomes string in TypeScript
  account: string;
  with: string;
  transaction: Pick<
    ATransaction,
    "id" | "value" | "description" | "from" | "to" | "created_at"
  >;
  profile: Pick<
    AProfile,
    "account" | "username" | "name" | "image" | "description"
  >;
  place: Pick<Place, "id" | "name" | "slug" | "image" | "description"> | null; // nullable
  exchange_direction: ExchangeDirection;
}

/**
 * Get the latest interactions of an account with a user or profile
 */

// TODO: check what the app's profile DB needs to store profile data

export async function getInteractionsOfAccount(
  supabase: SupabaseClient,
  account: string
): Promise<AInteraction[]> {
  const { data, error } = await supabase
    .rpc("get_latest_interactions", { account_param: account })
    .returns<AInteraction[]>();

  if (error) {
    throw error;
  }

  return data;
}
