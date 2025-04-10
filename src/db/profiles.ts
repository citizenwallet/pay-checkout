import "server-only";

import {
  PostgrestResponse,
  PostgrestSingleResponse,
  SupabaseClient,
} from "@supabase/supabase-js";
import { formatProfileImageLinks } from "@citizenwallet/sdk";
import { Profile } from "@citizenwallet/sdk";

export interface AProfile {
  created_at: string; // timestamp with time zone
  account: string; // text
  username: string; // text
  name: string; // text
  description: string; // text
  image: string; // text
  image_medium: string; // text
  image_small: string; // text
  token_id: string; // text
  updated_at: string; // timestamp without time zone
  place_id: bigint; // bigint
}

export async function getProfileByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<PostgrestSingleResponse<AProfile>> {
  return supabase
    .from("a_profiles")
    .select("*")
    .eq("username", username)
    .neq("token_id", null)
    .neq("token_id", "")
    .single();
}

export async function getProfilesByAccounts(
  supabase: SupabaseClient,
  accounts: string[]
): Promise<PostgrestResponse<AProfile>> {
  return supabase.from("a_profiles").select("*").in("account", accounts);
  // .neq("token_id", null) // TODO: remove this
  // .neq("token_id", "") // TODO: remove this
}

export const insertAnonymousProfile = async (
  client: SupabaseClient,
  account: string
): Promise<PostgrestSingleResponse<null>> => {
  const defaultProfileImageIpfsHash =
    process.env.DEFAULT_PROFILE_IMAGE_IPFS_HASH;
  if (!defaultProfileImageIpfsHash) {
    throw new Error("DEFAULT_PROFILE_IMAGE_IPFS_HASH is not set");
  }

  const ipfsDomain = process.env.IPFS_DOMAIN;
  if (!ipfsDomain) {
    throw new Error("IPFS_DOMAIN is not set");
  }

  const profile: Profile = formatProfileImageLinks(`https://${ipfsDomain}`, {
    account,
    username: "anonymous",
    name: "Anonymous",
    description: "This user does not have a profile",
    image: defaultProfileImageIpfsHash,
    image_medium: defaultProfileImageIpfsHash,
    image_small: defaultProfileImageIpfsHash,
  });
  return client.from("profiles").insert(profile);
};
