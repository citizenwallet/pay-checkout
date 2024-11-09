import "server-only";

import { SupabaseClient, createClient } from "@supabase/supabase-js";

export const getServiceRoleClient = (): SupabaseClient => {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
