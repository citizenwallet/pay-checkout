import { getServiceRoleClient } from "@/db";
import {
  attachProcessorTxToOrder,
  getOrder,
  updateOrderFees,
} from "@/db/orders";
import { CommunityConfig } from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import Config from "@/cw/community.json";
import { formatCurrencyNumber } from "@/lib/currency";
import { getItemsForPlace } from "@/db/items";
import { summarizeItemsForDescription } from "@/lib/items";
import {
  createOrderProcessorTx,
  getOrderProcessorTx,
} from "@/db/ordersProcessorTx";
import { Treasury } from "@/db/treasury";
import {
  insertTreasuryOperations,
  TreasuryOperation,
} from "@/db/treasury_operation";

export const chargeUpdated = async (
  stripe: Stripe,
  event: Stripe.Event,
  treasury: Treasury<"stripe">
) => {
  const charge = event.data.object as Stripe.Charge;

  // Log the metadata
  console.log("Charge Updated. Metadata:", charge.metadata);

  const amount = charge.metadata?.netAmount || charge.metadata?.amount;
  if (!amount) {
    return NextResponse.json({ error: "No amount" }, { status: 400 });
  }

  const netAmount: string | undefined = charge.metadata?.netAmount;

  const account = charge.metadata?.account;
  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const placeId = charge.metadata?.placeId;
  if (!placeId) {
    return NextResponse.json({ error: "No placeId" }, { status: 400 });
  }

  const placeName = charge.metadata?.placeName;

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

  let toMint = netAmount ? parseInt(netAmount) : parseInt(amount) - fees;
  if (toMint < 0) {
    toMint = 0;
  }

  const community = new CommunityConfig(Config);

  const client = getServiceRoleClient();

  const token = community.getToken(treasury.token);

  let description = `Received ${token.symbol} ${formatCurrencyNumber(toMint)}`;

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

  let paymentIntentId: string | null = null;
  if (typeof charge.payment_intent === "string") {
    paymentIntentId = charge.payment_intent;
  } else if (typeof charge.payment_intent === "object") {
    paymentIntentId = charge.payment_intent?.id || null;
  }

  if (!paymentIntentId) {
    return NextResponse.json({ received: true });
  }

  const { data: orderProcessorTx } = await getOrderProcessorTx(
    client,
    "stripe",
    paymentIntentId
  );
  if (orderProcessorTx) {
    console.log("Order processor tx already exists", paymentIntentId);
    return NextResponse.json({ received: true });
  }

  const { data: processorTx, error: processorTxError } =
    await createOrderProcessorTx(client, "stripe", paymentIntentId);
  if (processorTxError || !processorTx) {
    console.error("Error creating processor tx", processorTxError);
  }

  if (processorTx) {
    await attachProcessorTxToOrder(client, orderId, processorTx.id);
  }

  await updateOrderFees(client, orderId, fees);

  let message = `stripe operation - ${placeName} - ${orderId}`;
  if (charge.payment_method_details) {
    message += ` - ${charge.payment_method_details.type}`;
  }

  const operation: TreasuryOperation<"payg"> = {
    id: paymentIntentId,
    treasury_id: treasury.id,
    created_at: new Date(event.created * 1000).toISOString(),
    updated_at: new Date(event.created * 1000).toISOString(),
    direction: "in",
    amount: toMint,
    status: "pending",
    message,
    metadata: {
      order_id: orderId,
      description,
    },
    tx_hash: null,
    account,
  };

  await insertTreasuryOperations(client, [operation]);

  return NextResponse.json({ received: true });
};
