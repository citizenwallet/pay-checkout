import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  // QueryData,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Item } from "./items";

export interface Place {
  id: number;
  created_at: string;
  business_id: number;
  slug: string;
  name: string;
  accounts: string[];
  invite_code: string | null;
  terminal_id: number | null;
  image: string | null;
  description: string | null;
  display: "amount" | "menu" | "amountAndMenu" | "topup";
  hidden: boolean;
}

export interface PlaceWithItems extends Place {
  items: Item[];
}

export type NewPlace = Omit<
  Place,
  "id" | "created_at" | "terminal_id" | "description"
>;

export interface PlaceSearchResult {
  id: number;
  name: string;
  slug: string;
}

const PLACE_WITH_ITEMS_SELECT_QUERY = `
  *,
  items:pos_items(id,place_id,name,description,image,price,vat,category,order,hidden)
`;

export const getPlaceByUsername = async (
  client: SupabaseClient,
  username: string
): Promise<PostgrestSingleResponse<PlaceWithItems | null>> => {
  return client
    .from("places")
    .select(PLACE_WITH_ITEMS_SELECT_QUERY)
    .eq("slug", username)
    .eq("items.hidden", false)
    .maybeSingle();
};

export const getPlaceIdByUsername = async (
  client: SupabaseClient,
  username: string
): Promise<PostgrestSingleResponse<{ id: number } | null>> => {
  return client.from("places").select("id").eq("slug", username).maybeSingle();
};

export const getPlacesByBusinessId = async (
  client: SupabaseClient,
  businessId: number
): Promise<PostgrestResponse<Place | null>> => {
  return client.from("places").select("*").eq("business_id", businessId);
};

export const getPlaceByTerminalId = async (
  client: SupabaseClient,
  terminalId: number
): Promise<PostgrestSingleResponse<Place | null>> => {
  return client
    .from("places")
    .select("*")
    .eq("terminal_id", terminalId)
    .maybeSingle();
};

export const getPlacesByAccount = async (
  client: SupabaseClient,
  account: string
): Promise<PostgrestResponse<PlaceWithItems>> => {
  return client
    .from("places")
    .select(PLACE_WITH_ITEMS_SELECT_QUERY)
    .eq("items.hidden", false)
    .contains("accounts", JSON.stringify([account]));
};

export const getPlaceIdsByAccount = async (
  client: SupabaseClient,
  account: string
): Promise<PostgrestResponse<{ id: number }>> => {
  return client
    .from("places")
    .select("id")
    .contains("accounts", JSON.stringify([account]));
};

export const getPlaceById = async (
  client: SupabaseClient,
  id: number
): Promise<PostgrestSingleResponse<PlaceWithItems | null>> => {
  return client
    .from("places")
    .select(PLACE_WITH_ITEMS_SELECT_QUERY)
    .eq("items.hidden", false)
    .eq("id", id)
    .maybeSingle();
};

export const getPlaceBySlug = async (
  client: SupabaseClient,
  slug: string
): Promise<PostgrestSingleResponse<Place | null>> => {
  return client.from("places").select("*").eq("slug", slug).maybeSingle();
};

export const getPlaceByInviteCode = async (
  client: SupabaseClient,
  inviteCode: string
): Promise<PostgrestSingleResponse<PlaceWithItems | null>> => {
  return client
    .from("places")
    .select(PLACE_WITH_ITEMS_SELECT_QUERY)
    .eq("items.hidden", false)
    .eq("invite_code", inviteCode)
    .maybeSingle();
};

export const getPlaceIdByInviteCode = async (
  client: SupabaseClient,
  inviteCode: string
): Promise<PostgrestSingleResponse<{ id: number } | null>> => {
  return client
    .from("places")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();
};

export const searchPlaces = async (
  client: SupabaseClient,
  query: string
): Promise<PostgrestResponse<PlaceSearchResult>> => {
  return client
    .from("places")
    .select("id, name, slug")
    .eq("hidden", false)
    .ilike("name", `%${query}%`);
};

export const createPlace = async (
  client: SupabaseClient,
  place: NewPlace
): Promise<PostgrestSingleResponse<Place>> => {
  return client.from("places").insert(place).select().single();
};

export const updatePlaceAccounts = async (
  client: SupabaseClient,
  placeId: number,
  accounts: string[]
): Promise<PostgrestSingleResponse<Place>> => {
  return client
    .from("places")
    .update({ accounts })
    .eq("id", placeId)
    .select()
    .single();
};

// TODO: add pagination
export const getAllPlaces = async (
  client: SupabaseClient
): Promise<
  Pick<
    Place,
    "id" | "name" | "slug" | "image" | "accounts" | "description" | "display"
  >[]
> => {
  const placesQuery = client
    .from("places")
    .select("id, name, slug, image, accounts ,description, display")
    .eq("hidden", false)
    .order("name", { ascending: true });

  const { data, error } = await placesQuery;

  if (error) {
    throw error;
  }

  return data;
};
