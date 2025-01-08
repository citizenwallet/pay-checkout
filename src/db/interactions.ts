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
    "id" | "name" | "slug" | "image" | "description"
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
    image,
    place:places (
      id,
      name,
      slug,
      image,
      description
    )
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
    .order("updated_at", { ascending: false });

  const { data, error } = await interactionsQuery;
  if (error) throw error;

  return data.map((rawData) => createAInteraction(rawData, account));
}

export type UpdateableInteractionFields = {
  new_interaction?: boolean;
  // Add other updatable fields here
};
export async function updateInteractionOfAccount(
  supabase: SupabaseClient,
  account: string,
  interactionId: string,
  updates: UpdateableInteractionFields
): Promise<AInteraction> {
  if (Object.keys(updates).length === 0) {
    throw new Error("No fields to update");
  }

  const { data: existingInteraction, error: findError } = await supabase
    .from("a_interactions")
    .select("*")
    .eq("id", interactionId)
    .eq("account", account)
    .single();

  if (findError || !existingInteraction) {
    throw new Error("Interaction not found or access denied");
  }

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("a_interactions")
    .update(updateData)
    .eq("id", interactionId)
    .eq("account", account)
    .select(INTERACTIONS_SELECT_QUERY)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update interaction");

  return createAInteraction(data, account);
}

type RawInteractionData = {
  id: string;
  new_interaction: boolean;
  transaction: unknown;
  with_profile: unknown;
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
  > & {
    place: Pick<Place, "id" | "name" | "slug" | "image" | "description"> | null;
  };

  const with_place = with_profile.place;

  return {
    id: rawData.id,
    exchange_direction: transaction.from === account ? "sent" : "received",
    new_interaction: rawData.new_interaction,
    transaction,
    with_profile: {
      account: with_profile.account,
      username: with_profile.username,
      name: with_profile.name,
      description: with_profile.description,
      image: with_profile.image,
    },
    with_place,
  };
}
