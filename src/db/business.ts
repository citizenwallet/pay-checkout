import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export interface Business {
  id: number;
  created_at: string;
  name: string | null;
  status: string | null;
  vat_number: string | null;
  business_status: string | null;
  account: string | null;
  email: string | null;
  phone: string | null;
}

export type NewBusiness = Omit<Business, "id" | "created_at">;

export const createBusiness = async (
  client: SupabaseClient,
  business: NewBusiness
): Promise<PostgrestSingleResponse<Business>> => {
  return client.from("businesses").insert(business).select().single();
};
