import { getOrderByProcessorTxId, refundOrder } from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { getPlaceById } from "@/db/places";
import { VivaTransactionData } from "@/viva";
import { CommunityConfig } from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import {
  createOrderProcessorTx,
  getOrderProcessorTx,
} from "@/db/ordersProcessorTx";
import {
  insertTreasuryOperations,
  TreasuryOperation,
} from "@/db/treasury_operation";
import { Treasury } from "@/db/treasury";
import { formatCurrencyNumber } from "@/lib/currency";

export const transactionReversalCreated = async (
  treasury: Treasury<"viva">,
  data: VivaTransactionData
) => {
  const { ParentId, TransactionId, Amount, TotalFee, InsDate } = data;

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

  if (placeError || !place) {
    console.error("Error getting place by terminal id", placeError);
    return NextResponse.json({ received: true });
  }

  const amount = Number((Math.abs(Amount) * 100).toFixed(0));
  const fees = Number((Math.abs(TotalFee) * 100).toFixed(0));

  const { data: orderProcessorTx } = await getOrderProcessorTx(
    client,
    "viva",
    `${TransactionId}-refund`
  );
  if (orderProcessorTx) {
    console.log("Order processor tx already exists", TransactionId);
    return NextResponse.json({ received: true });
  }

  const { data: createdProcessorTx, error: processorTxError } =
    await createOrderProcessorTx(client, "viva", `${TransactionId}-refund`);
  if (processorTxError || !createdProcessorTx) {
    console.error("Error creating processor tx", processorTxError);
  }

  const { data: refundOrderData, error: updateError } = await refundOrder(
    client,
    order.id,
    amount,
    fees,
    createdProcessorTx?.id ?? null
  );
  if (updateError) {
    console.error("Error updating order", updateError);
    return NextResponse.json({ received: true });
  }

  if (!refundOrderData) {
    console.error("Error refunding order", refundOrderData);
    return NextResponse.json({ received: true });
  }

  let toBurn = amount + fees;
  if (order.status === "needs_minting") {
    // If the order was already not minted, we only need to burn the fees
    toBurn = fees;
  }

  const community = new CommunityConfig(Config);

  const token = community.getToken(treasury.token);

  const account = place.accounts[0];
  if (!account) {
    console.error("Error getting account", account);
    return NextResponse.json({ received: true });
  }

  const createdAt = new Date(InsDate);

  const message = `viva refund operation - ${place.display} - ${order.id} - ${transactionId}`;

  const description = `Refunded ${token.symbol} ${formatCurrencyNumber(
    toBurn
  )} - #${order.id}`;

  const operation: TreasuryOperation<"payg"> = {
    id: `${TransactionId}-refund`,
    treasury_id: treasury.id,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
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

  await insertTreasuryOperations(client, [operation]);

  return NextResponse.json({ received: true });
};
