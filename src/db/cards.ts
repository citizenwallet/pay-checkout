import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";

export type PosType = "app" | "viva";

export interface Card {
  serial: string;
  project: string | null;
  created_at: string;
  updated_at: string;
  owner: string | null;
  pin: string | null;
}

export type PublicCard = Omit<Card, "pin">;

export type CardPin = {
  pin: string | null;
};

export const getCardBySerial = async (
  client: SupabaseClient,
  serial: string
): Promise<PostgrestSingleResponse<PublicCard | null>> => {
  return client
    .from("cards")
    .select("serial, project, created_at, updated_at, owner")
    .eq("serial", serial)
    .maybeSingle();
};

export const getCardPin = async (
  client: SupabaseClient,
  serial: string
): Promise<PostgrestSingleResponse<CardPin | null>> => {
  return client.from("cards").select("pin").eq("serial", serial).maybeSingle();
};

export const getCardsByOwner = async (
  client: SupabaseClient,
  owner: string
): Promise<PostgrestResponse<PublicCard>> => {
  return client
    .from("cards")
    .select("serial, project, created_at, updated_at, owner", {
      count: "exact",
    })
    .eq("owner", owner);
};

export const claimCard = async (
  client: SupabaseClient,
  serial: string,
  project: string | null,
  account: string,
  pin: string | null
): Promise<PostgrestSingleResponse<PublicCard | null>> => {
  const now = new Date().toISOString();
  return client
    .from("cards")
    .upsert({ serial, project, owner: account, pin, updated_at: now })
    .select("serial, project, created_at, updated_at, owner")
    .maybeSingle();
};

export const unclaimCard = async (
  client: SupabaseClient,
  serial: string
): Promise<PostgrestSingleResponse<PublicCard | null>> => {
  const now = new Date().toISOString();
  return client
    .from("cards")
    .update({ owner: null, pin: null, updated_at: now })
    .eq("serial", serial);
};
