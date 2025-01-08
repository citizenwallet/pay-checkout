import "server-only";
import { ATransaction, ExchangeDirection } from "./transactions";
import { AProfile } from "./profiles";
import { Place } from "./places";
import { QueryData, SupabaseClient } from "@supabase/supabase-js";

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



// TODO: paginate
export async function getInteractionsOfAccount(
  supabase: SupabaseClient,
  account: string
): Promise<AInteraction[]> {

  const interactionsQuery = supabase
    .from("a_interactions")
    .select(
      `
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
  `
    )
    .eq("account", account)
    .order("created_at", { ascending: false });

  type RawInteraction = QueryData<typeof interactionsQuery>[number];

  const { data, error } = await interactionsQuery;
  if (error) throw error;

  const transformed: AInteraction[] = data.map(
    (interaction: RawInteraction) => {
      
      const transaction = interaction.transaction as unknown as Pick<
        ATransaction,
        "id" | "value" | "description" | "from" | "to" | "created_at"
        >;
      
      const with_profile = interaction.with_profile as unknown as Pick<
        AProfile,
        "account" | "username" | "name" | "description" | "image"
        > & { place: Pick<Place, "id" | "name" | "slug" | "image" | "description"> | null };
      

      const with_place = with_profile.place;

      return {
        id: interaction.id,
        exchange_direction: transaction.from === account ? 'sent' : 'received',
        new_interaction: interaction.new_interaction,
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
  );

  return transformed;
}

export async function getNewInteractionsOfAccount(
  supabase: SupabaseClient,
  account: string,
  fromDate: Date
): Promise<AInteraction[]> {

  const interactionsQuery = supabase
    .from("a_interactions")
    .select(
      `
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
    `
    )
    .eq("account", account)
    .gt("updated_at", fromDate.toISOString())
    .order("updated_at", { ascending: false });
  
   type RawInteraction = QueryData<typeof interactionsQuery>[number];

   const { data, error } = await interactionsQuery;
   if (error) throw error;

   const transformed: AInteraction[] = data.map(
     (interaction: RawInteraction) => {
       const transaction = interaction.transaction as unknown as Pick<
         ATransaction,
         "id" | "value" | "description" | "from" | "to" | "created_at"
       >;

       const with_profile = interaction.with_profile as unknown as Pick<
         AProfile,
         "account" | "username" | "name" | "description" | "image"
       > & {
         place: Pick<
           Place,
           "id" | "name" | "slug" | "image" | "description"
         > | null;
       };

       const with_place = with_profile.place;

       return {
         id: interaction.id,
         exchange_direction: transaction.from === account ? "sent" : "received",
         new_interaction: interaction.new_interaction,
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
   );

   return transformed;

}