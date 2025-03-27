import { getServiceRoleClient } from "@/db";
import { attachTxHashToOrder, getOrder, updateOrderFees } from "@/db/orders";
import {
  BundlerService,
  CommunityConfig,
  getAccountAddress,
} from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import Config from "@/cw/community.json";
import { formatCurrencyNumber } from "@/lib/currency";
import { getItemsForPlace } from "@/db/items";
import { summarizeItemsForDescription } from "@/lib/items";

export const chargeUpdated = async (stripe: Stripe, event: Stripe.Event) => {
  const charge = event.data.object as Stripe.Charge;

  // Log the metadata
  console.log("Charge Updated. Metadata:", charge.metadata);

  const amount = charge.metadata?.amount;
  if (!amount) {
    return NextResponse.json({ error: "No amount" }, { status: 400 });
  }

  const account = charge.metadata?.account;
  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const placeId = charge.metadata?.placeId;
  if (!placeId) {
    return NextResponse.json({ error: "No placeId" }, { status: 400 });
  }

  const orderId = parseInt(charge.metadata?.orderId ?? "0");
  if (!orderId || isNaN(orderId)) {
    return NextResponse.json({ error: "No orderId" }, { status: 400 });
  }

  if (!charge.balance_transaction) {
    return;
  }

  let fees = 0;
  switch (typeof charge.balance_transaction) {
    case "string": {
      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        charge.balance_transaction
      );

      fees = balanceTransaction.fee;
      break;
    }
    case "object": {
      const balanceTransaction: Stripe.BalanceTransaction =
        charge.balance_transaction;

      if (balanceTransaction.fee) {
        fees = balanceTransaction.fee;
      }
      break;
    }
  }

  const intAmount = parseInt(amount);
  let netAmount = intAmount - fees;
  if (netAmount < 0) {
    netAmount = 0;
  }

  const community = new CommunityConfig(Config);

  const client = getServiceRoleClient();

  let description = `Received ${
    community.primaryToken.symbol
  } ${formatCurrencyNumber(intAmount)}`;

  try {
    const { data: order } = await getOrder(client, orderId);
    const { data: items } = await getItemsForPlace(client, parseInt(placeId));
    if (order && items) {
      if (order.description) {
        description = order.description;
      }
      if (items.length) {
        description = summarizeItemsForDescription(items, order);
      }
    }
  } catch (error) {
    console.error(error);
  }

  await updateOrderFees(client, orderId, fees);

  if (
    !process.env.FAUCET_PRIVATE_KEY ||
    process.env.FAUCET_PRIVATE_KEY === "DEV"
  ) {
    return NextResponse.json({ received: true });
  }

  const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY!);

  const senderAccount = await getAccountAddress(community, signer.address);
  if (!senderAccount) {
    return NextResponse.json({ error: "No sender account" }, { status: 400 });
  }

  const bundler = new BundlerService(community);

  const txHash = await bundler.mintERC20Token(
    signer,
    community.primaryToken.address,
    senderAccount,
    account,
    `${netAmount / 100}`,
    description
  );

  await attachTxHashToOrder(client, orderId, txHash);
};
