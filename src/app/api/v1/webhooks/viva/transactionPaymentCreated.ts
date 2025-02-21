import { attachTxHashToOrder } from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { BundlerService } from "@citizenwallet/sdk";
import { createTerminalOrder } from "@/db/orders";
import { getPlaceByTerminalId } from "@/db/places";
import { getAccountAddress } from "@citizenwallet/sdk";
import { VivaTransactionPaymentCreated } from "@/viva";
import { CommunityConfig } from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { getTransaction } from "@/viva/transactions";

export const transactionPaymentCreated = async (
  data: VivaTransactionPaymentCreated
) => {
  const { TerminalId, TransactionId, Amount = 0 } = data;

  console.log("Amount", Amount);

  const amount = Number((Amount * 100).toFixed(0));

  console.log("amount", amount);

  const basicAuth = Buffer.from(
    `${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_API_KEY}`
  ).toString("base64");

  const transaction = await getTransaction(basicAuth, TransactionId);

  if (!transaction) {
    console.error("Transaction not found", TransactionId);
    return NextResponse.json({ received: true });
  }

  const commission = Number((transaction.Commission * 100).toFixed(0));

  const client = getServiceRoleClient();
  const { data: place, error: placeError } = await getPlaceByTerminalId(
    client,
    TerminalId
  );

  if (placeError || !place) {
    console.error("Error getting place by terminal id", placeError);
    return NextResponse.json({ received: true });
  }

  const description = `Order: ${TransactionId}`;

  const { data: order, error: orderError } = await createTerminalOrder(
    client,
    place.id,
    amount,
    commission,
    description
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

  const intAmount = amount;

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
    `${intAmount / 100}`,
    description
  );

  await attachTxHashToOrder(client, order.id, txHash);
};
