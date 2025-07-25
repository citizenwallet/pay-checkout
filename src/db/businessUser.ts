import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface BusinessUser {
  user_id: number;
  business_id: number;
  role: "member" | "owner";
}

export const createBusinessUser = async (
  client: SupabaseClient,
  user_id: number,
  business_id: number,
  role: string
): Promise<PostgrestSingleResponse<BusinessUser>> => {
  return client
    .from("business_users")
    .insert({ user_id, business_id, role })
    .select()
    .single();
};

export const isOwnerOfBusiness = async (
  client: SupabaseClient,
  user_id: number,
  business_id: number
): Promise<boolean> => {
  const { data, error } = await client
    .from("business_users")
    .select("*")
    .eq("user_id", user_id)
    .eq("business_id", business_id)
    .single();

  if (error) {
    return false;
  }

  return data?.role === "owner";
};
