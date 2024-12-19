"use server";

import { CommunityConfig, getAccountBalance } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export const getAccountBalanceAction = async (
  address: string
): Promise<bigint | null> => {
  const community = new CommunityConfig(Config);

  const balance = await getAccountBalance(community, address);

  if (!balance) return null;

  const decimals = community.primaryToken.decimals - 2;

  return balance / BigInt(10 ** (decimals ?? 0));
};
