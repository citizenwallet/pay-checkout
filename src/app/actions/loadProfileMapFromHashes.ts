"use server";

import { getServiceRoleClient } from "@/db";
import { AProfile } from "@/db/profiles";
import { getProfileMapFromTransactionHashes } from "@/db/transactions";

export const loadProfileMapFromHashesAction = async (
  hashes: string[],
  direction: "from" | "to" = "from"
): Promise<{ [key: string]: AProfile }> => {
  const client = getServiceRoleClient();

  try {
    return getProfileMapFromTransactionHashes(client, hashes, direction);
  } catch (e) {
    console.error(e);
    return {};
  }
};
