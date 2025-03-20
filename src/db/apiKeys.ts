import "server-only";

import { SupabaseClient } from "@supabase/supabase-js";

export interface ApiKey {
  key: string;
  created_at: string;
  scopes: string[];
}

export type NewApiKey = Omit<ApiKey, "created_at">;

export const checkApiKey = async (
  client: SupabaseClient,
  key: string,
  scopes: string[]
): Promise<boolean> => {
  const { data, error } = await client
    .from("api_keys")
    .select("*")
    .eq("key", key)
    .single();
  if (error) {
    console.error(error);
    return false;
  }

  if (!data || data.scopes.length === 0) {
    return false;
  }

  return data.scopes.some((scope: string) =>
    scopes.some((s: string) => scope.includes(s))
  );
};
