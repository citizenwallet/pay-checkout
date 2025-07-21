import { getServiceRoleClient } from "@/db";
import { getOrder, getOrderByProcessorTxId, refundOrder } from "@/db/orders";
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

export const chargeRefunded = async (
  stripe: Stripe,
  event: Stripe.Event,
  treasury: Treasury<"stripe">
) => {
  const charge = event.data.object as Stripe.Charge;

  // Log the metadata
  console.log("Charge Refunded. Metadata:", charge.metadata);

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

  let toBurn = netAmount ? parseInt(netAmount) : parseInt(amount) + fees;
  if (toBurn < 0) {
    toBurn = 0;
  }

  const community = new CommunityConfig(Config);

  const token = community.getToken(treasury.token);

  const client = getServiceRoleClient();

  let description = `Refunded ${
    community.primaryToken.symbol
  } ${formatCurrencyNumber(toBurn)}`;

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
    console.error("No payment intent id");
    return NextResponse.json({ received: true });
  }

  const { data: orderProcessorTx } = await getOrderProcessorTx(
    client,
    "stripe",
    paymentIntentId
  );
  if (!orderProcessorTx) {
    console.log("Order processor tx does not exist", paymentIntentId);
    return NextResponse.json({ received: true });
  }

  // find the order that has this processor tx
  const { data: order, error: orderError } = await getOrderByProcessorTxId(
    client,
    orderProcessorTx.id
  );
  if (orderError || !order) {
    console.error("Order does not exist", orderError);
    return NextResponse.json({ received: true });
  }

  // if the order is already refunded, do nothing
  if (order.status === "refunded") {
    console.error("Order is already refunded", order);
    return NextResponse.json({ received: true });
  }

  const { data: refundOrderProcessorTx } = await getOrderProcessorTx(
    client,
    "stripe",
    `${paymentIntentId}-refund`
  );
  if (refundOrderProcessorTx) {
    console.log("Order processor tx already exists", paymentIntentId);
    return NextResponse.json({ received: true });
  }

  const { data: createdProcessorTx, error: processorTxError } =
    await createOrderProcessorTx(client, "stripe", `${paymentIntentId}-refund`);
  if (processorTxError || !createdProcessorTx) {
    console.error("Error creating processor tx", processorTxError);
  }

  console.log("Created processor tx", createdProcessorTx);

  // update the order to refunded
  const { data: refundOrderData, error: refundOrderError } = await refundOrder(
    client,
    orderId,
    parseInt(amount),
    fees,
    createdProcessorTx?.id ?? null
  );
  if (refundOrderError) {
    console.error("Error refunding order", refundOrderError);
    return NextResponse.json({ received: true });
  }

  if (!refundOrderData) {
    console.error("Missing refund order data", orderId);
    return NextResponse.json({ received: true });
  }

  if (order.status === "needs_minting") {
    // If the order was already not minted, we only need to burn the fees
    toBurn = fees;

    description = `Refunded ${token.symbol} ${formatCurrencyNumber(toBurn)}`;
  }

  console.log("description", description);

  const message = `stripe refund operation - ${placeName} - ${orderId}`;

  console.log("message", message);

  const operation: TreasuryOperation<"payg"> = {
    id: paymentIntentId,
    treasury_id: treasury.id,
    created_at: new Date(event.created * 1000).toISOString(),
    updated_at: new Date(event.created * 1000).toISOString(),
    direction: "out",
    amount: toBurn,
    status: "pending",
    message,
    metadata: {
      order_id: refundOrderData.id,
      description,
    },
    tx_hash: null,
    account,
  };

  console.log("operation", operation);

  const { error: insertError } = await insertTreasuryOperations(client, [
    operation,
  ]);
  if (insertError) {
    console.error("Error inserting operation", insertError);
  }

  return NextResponse.json({ received: true });
};
