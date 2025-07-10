import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

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
