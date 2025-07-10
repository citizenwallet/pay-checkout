import "server-only";
import { ATransaction, ExchangeDirection } from "./transactions";
import { AProfile } from "./profiles";
import { Place } from "./places";
import { SupabaseClient } from "@supabase/supabase-js";

export interface AInteraction {
  id: string; // uuid becomes string in TypeScript
  exchange_direction: ExchangeDirection;
  new_interaction: boolean;

  transaction: Pick<
    ATransaction,
    "id" | "value" | "description" | "from" | "to" | "created_at"
  >;
  with_profile: Pick<
    AProfile,
    "account" | "username" | "name" | "image" | "description"
  >;
  with_place: Pick<
    Place,
    "id" | "name" | "slug" | "image" | "description" | "display" | "accounts"
  > | null; // nullable
}

export const INTERACTIONS_SELECT_QUERY = `
  id,
  new_interaction,
  transaction:a_transactions!transaction_id (
    id,
    created_at,
    from,
    to,
    value,
    description
  ),
  with_profile:a_profiles!with (
    account,
    username,
    name,
    description,
    image
  ),
  with_place:places!place_id (
    id,
    name,
    slug,
    image,
    description,
    display,
    accounts
  )
` as const;

// TODO: paginate
export async function getInteractionsOfAccount(
  supabase: SupabaseClient,
  account: string
): Promise<AInteraction[]> {
  const interactionsQuery = supabase
    .from("a_interactions")
    .select(INTERACTIONS_SELECT_QUERY)
    .eq("account", account)
    .order("new_interaction", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data, error } = await interactionsQuery;
  if (error) throw error;

  return data.map((rawData) => createAInteraction(rawData, account));
}

export async function getNewInteractionsOfAccount(
  supabase: SupabaseClient,
  account: string,
  fromDate: Date
): Promise<AInteraction[]> {
  const interactionsQuery = supabase
    .from("a_interactions")
    .select(INTERACTIONS_SELECT_QUERY)
    .eq("account", account)
    .gt("updated_at", fromDate.toISOString())
    .order("new_interaction", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data, error } = await interactionsQuery;
  if (error) throw error;

  return data.map((rawData) => createAInteraction(rawData, account));
}

export async function setInteractionAsRead(
  supabase: SupabaseClient,
  account: string,
  interactionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("a_interactions")
    .update({ new_interaction: false })
    .eq("id", interactionId)
    .eq("account", account)
    .single();

  if (error) return false;

  return true;
}

type RawInteractionData = {
  id: string;
  new_interaction: boolean;
  transaction: unknown;
  with_profile: unknown;
  with_place: unknown;
};

function createAInteraction(
  rawData: RawInteractionData,
  account: string
): AInteraction {
  const transaction = rawData.transaction as unknown as Pick<
    ATransaction,
    "id" | "value" | "description" | "from" | "to" | "created_at"
  >;

  const with_profile = rawData.with_profile as unknown as Pick<
    AProfile,
    "account" | "username" | "name" | "description" | "image"
  >;

  const with_place = rawData.with_place as Pick<
    Place,
    "id" | "name" | "slug" | "image" | "description" | "display" | "accounts"
  > | null;

  return {
    id: rawData.id,
    exchange_direction: transaction.from === account ? "sent" : "received",
    new_interaction: rawData.new_interaction,
    transaction,
    with_profile,
    with_place,
  };
}
