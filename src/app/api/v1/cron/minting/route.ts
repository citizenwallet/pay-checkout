import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import {
  completeOrder,
  attachTxHashToOrder,
  getOrdersByStatus,
} from "@/db/orders";
import {
  BundlerService,
  CommunityConfig,
  getAccountAddress,
} from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { Wallet } from "ethers";
import { getPlaceById } from "@/db/places";

// TODO: remove if new sync systems works
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const client = getServiceRoleClient();

  const { data: orders, error } = await getOrdersByStatus(
    client,
    "needs_minting",
    20
  );

  if (error) {
    return new Response("Error", {
      status: 500,
    });
  }

  if (orders.length === 0) {
    return new Response("No orders to mint", {
      status: 200,
    });
  }

  const community = new CommunityConfig(Config);

  for (const order of orders) {
    const { data: place, error: placeError } = await getPlaceById(
      client,
      order.place_id
    );
    if (placeError || !place) {
      continue;
    }

    const isTopup = place.display === "topup";

    let toMint = order.total - order.fees;
    if (isTopup) {
      // for topups, we mint the full amount
      toMint = order.total;

      // TODO: handle figuring out which account to mint to
      continue;
    }
    if (toMint <= 0) {
      await completeOrder(client, order.id);
      continue;
    }

    const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY!);
    const senderAccount = await getAccountAddress(community, signer.address);
    if (!senderAccount) {
      continue;
    }

    const account = place.accounts[0];
    if (!account) {
      continue;
    }

    const bundler = new BundlerService(community);
    const txHash = await bundler.mintERC20Token(
      signer,
      community.primaryToken.address,
      senderAccount,
      account,
      `${toMint / 100}`
    );

    try {
      await bundler.awaitSuccess(txHash);
    } catch (error) {
      console.error("Error when minting", error);
      return new Response("Error", {
        status: 500,
      });
    }

    await attachTxHashToOrder(client, order.id, txHash);
  }

  return new NextResponse("orders minted", { status: 200 });
}
