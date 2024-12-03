"use server";

import { Profile } from "@citizenwallet/sdk";
import { getProfileByUsername } from "@/db/profiles";
import { getServiceRoleClient } from "@/db";

export const loadProfileForUsernameAction = async (
  username: string
): Promise<Profile | null> => {
  const client = getServiceRoleClient();

  try {
    const { data } = await getProfileByUsername(client, username);

    return data ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
