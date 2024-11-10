"use server";

import { CommunityConfig, getProfileFromUsername } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export const loadProfileForUsernameAction = async (username: string) => {
  const community = new CommunityConfig(Config);

  try {
    return await getProfileFromUsername(community, username);
  } catch (e) {
    return null;
  }
};
