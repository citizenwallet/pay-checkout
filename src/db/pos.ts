import "server-only";

import {
  PostgrestSingleResponse,
  // QueryData,
  SupabaseClient,
} from "@supabase/supabase-js";

export type PosType = "app" | "viva";

export interface Pos {
  id: string;
  name: string;
  created_at: string;
  place_id: number;
  type: PosType;
  last_active_at: string;
  is_active: boolean;
}

export const getPosByIdSuffix = async (
  client: SupabaseClient,
  idSuffix: string
): Promise<PostgrestSingleResponse<Pos | null>> => {
  return client
    .from("pos")
    .select("*")
    .like("id", `%${idSuffix}`)
    .maybeSingle();
};
