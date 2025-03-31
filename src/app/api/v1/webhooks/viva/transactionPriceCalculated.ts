import { attachTxHashToOrder, orderNeedsMinting } from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { BundlerService } from "@citizenwallet/sdk";
import { createTerminalOrder } from "@/db/orders";
import { getPlaceById } from "@/db/places";
import { getAccountAddress } from "@citizenwallet/sdk";
import { VivaTransactionPriceCalculated } from "@/viva";
import { CommunityConfig } from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { getVivaTransaction } from "@/viva/transactions";
import { getTerminalIdFromOrderCode } from "@/viva/terminal";
import { getVivaPosByIdSuffix } from "@/db/pos";
import {
  createOrderProcessorTx,
  getOrderProcessorTx,
} from "@/db/ordersProcessorTx";

export const transactionPriceCalculated = async (
  data: VivaTransactionPriceCalculated
) => {
  const { OrderCode, TransactionId, TotalCommission = 0.0 } = data;

  const terminalIdSuffix = await getTerminalIdFromOrderCode(OrderCode);

  const client = getServiceRoleClient();

  const { data: pos, error } = await getVivaPosByIdSuffix(
    client,
    terminalIdSuffix
  );
  if (!pos || error) {
    console.error("Pos not found", terminalIdSuffix);
    return NextResponse.json({ received: true });
  }

  const { data: place, error: placeError } = await getPlaceById(
    client,
    pos.place_id
  );

  const transaction = await getVivaTransaction(TransactionId);

  if (!transaction) {
    console.error("Transaction not found", TransactionId);
    return NextResponse.json({ received: true });
  }

  const { data: orderProcessorTx } = await getOrderProcessorTx(
    client,
    "viva",
    TransactionId
  );
  if (orderProcessorTx) {
    console.log("Order processor tx already exists", TransactionId);
    return NextResponse.json({ received: true });
  }

  const txAmount = transaction.originalAmount || 0.0;
  const amount = Number((txAmount * 100).toFixed(0));

  console.log("amount", amount);

  const txCommission = TotalCommission || 0.0;
  const commission = Number((txCommission * 100).toFixed(0));

  console.log("commission", commission);

  if (placeError || !place) {
    console.error("Error getting place by terminal id", placeError);
    return NextResponse.json({ received: true });
  }

  const { data: processorTx, error: processorTxError } =
    await createOrderProcessorTx(client, "viva", TransactionId);
  if (processorTxError || !processorTx) {
    console.error("Error creating processor tx", processorTxError);
  }

  const { data: order, error: orderError } = await createTerminalOrder(
    client,
    place.id,
    amount,
    commission,
    pos.id,
    processorTx?.id || null
  );

  if (orderError || !order) {
    console.error("Error creating terminal order", orderError);
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

  let mintAmount = amount - commission;
  if (mintAmount < 0) {
    mintAmount = 0;
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

  const txHash = await bundler.mintERC20Token(
    signer,
    community.primaryToken.address,
    senderAccount,
    account,
    `${mintAmount / 100}`
  );

  await attachTxHashToOrder(client, order.id, txHash);

  try {
    await bundler.awaitSuccess(txHash);
  } catch (error) {
    console.error("Error when minting", error);
    await orderNeedsMinting(client, order.id);
  }

  return NextResponse.json({ received: true });
};
