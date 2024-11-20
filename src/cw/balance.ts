"use server";

import { CommunityConfig } from "@citizenwallet/sdk";
import { Contract } from "ethers";
import { JsonRpcProvider } from "ethers";
import erc20Abi from "@/cw/ERC20.abi.json";
import Config from "@/cw/community.json";

export const getAccountBalance = async (
  address: string
): Promise<bigint | null> => {
  const community = new CommunityConfig(Config);

  const rpc = new JsonRpcProvider(community.primaryRPCUrl);
  const contract = new Contract(community.primaryToken.address, erc20Abi, rpc);

  try {
    const balance: bigint | null = await contract.getFunction("balanceOf")(
      address
    );
    if (!balance) return null;

    const decimals = community.primaryToken.decimals - 2;

    return balance / BigInt(10 ** (decimals ?? 0));
  } catch (error) {
    console.error("Error fetching account balance:", error);

    return null;
  }
};
