import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name: string;
  auth_id: string;
  linked_business_id: number | null;
}

export async function getUserByEmail(
  client: SupabaseClient,
  email: string
): Promise<PostgrestSingleResponse<User>> {
  return client.from("users").select("*").eq("email", email).single();
}

export async function createUser(
  client: SupabaseClient,
  email: string,
  linked_business_id: number | null
) {
  return client
    .from("users")
    .insert({ email, linked_business_id })
    .select()
    .single();
}
