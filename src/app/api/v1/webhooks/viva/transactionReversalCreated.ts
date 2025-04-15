import {
  getOrderByProcessorTxId,
  orderNeedsBurning,
  refundOrder,
} from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { BundlerService } from "@citizenwallet/sdk";
import { getPlaceById } from "@/db/places";
import { getAccountAddress } from "@citizenwallet/sdk";
import { VivaTransactionData } from "@/viva";
import { CommunityConfig } from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { getOrderProcessorTx } from "@/db/ordersProcessorTx";

export const transactionReversalCreated = async (data: VivaTransactionData) => {
  const { ParentId, TransactionId, Amount } = data;

  const transactionId = ParentId || TransactionId;

  const client = getServiceRoleClient();

  const { data: processorTx, error } = await getOrderProcessorTx(
    client,
    "viva",
    transactionId
  );
  if (!processorTx || error) {
    console.error("Processor tx not found", transactionId);
    return NextResponse.json({ received: true });
  }

  const { data: order, error: orderError } = await getOrderByProcessorTxId(
    client,
    processorTx.id
  );
  if (orderError || !order) {
    console.error("Order not found", processorTx.id);
    return NextResponse.json({ received: true });
  }

  if (order.status === "refunded") {
    console.error("Order is already refunded", order);
    return NextResponse.json({ received: true });
  }

  const { data: place, error: placeError } = await getPlaceById(
    client,
    order.place_id
  );

  const amount = Number((Math.abs(Amount) * 100).toFixed(0));

  console.log("amount", amount);

  if (placeError || !place) {
    console.error("Error getting place by terminal id", placeError);
    return NextResponse.json({ received: true });
  }

  // update the order to refunded
  const { error: updateError } = await refundOrder(client, order.id);
  if (updateError) {
    console.error("Error updating order", updateError);
    return NextResponse.json({ received: true });
  }

  if (order.status === "needs_minting") {
    console.error("Order was already not minted, so no need to burn", order);
    return NextResponse.json({ received: true });
  }

  if (
    !process.env.FAUCET_PRIVATE_KEY ||
    process.env.FAUCET_PRIVATE_KEY === "DEV"
  ) {
    console.error("No faucet private key");
    return NextResponse.json({ received: true });
  }

  const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY!);

  const community = new CommunityConfig(Config);

  let toBurn = amount;
  if (toBurn < 0) {
    toBurn = 0;
  }

  const senderAccount = await getAccountAddress(community, signer.address);
  if (!senderAccount) {
    console.error("Error getting sender account", senderAccount);
    return NextResponse.json({ received: true });
  }

  const account = place.accounts[0];
  if (!account) {
    console.error("Error getting account", account);
    return NextResponse.json({ received: true });
  }

  const bundler = new BundlerService(community);

  const txHash = await bundler.burnFromERC20Token(
    signer,
    community.primaryToken.address,
    senderAccount,
    account,
    `${toBurn / 100}`
  );

  try {
    await bundler.awaitSuccess(txHash);
  } catch (error) {
    console.error("Error when burning", error);
    await orderNeedsBurning(client, order.id);
  }

  return NextResponse.json({ received: true });
};
