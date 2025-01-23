import "server-only";

import { SupabaseClient } from "@supabase/supabase-js";

interface UserData {
  user: null;
  session: null;
  messageId?: string | null;
}

export async function signInWithEmail(
  client: SupabaseClient,
  email: string,
  inviteCode: string
): Promise<UserData | null> {
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.SUPABASE_AUTH_REDIRECT_URL}?invite_code=${inviteCode}`,
    },
  });

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}
