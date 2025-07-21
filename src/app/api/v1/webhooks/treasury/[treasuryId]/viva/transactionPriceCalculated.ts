import { getServiceRoleClient } from "@/db";
import { createTerminalOrder } from "@/db/orders";
import { getPlaceById } from "@/db/places";
import { VivaTransactionPriceCalculated } from "@/viva";
import { CommunityConfig } from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { getVivaTransaction } from "@/viva/transactions";
import { getTerminalIdFromOrderCode } from "@/viva/terminal";
import { getVivaPosByIdSuffix } from "@/db/pos";
import {
  createOrderProcessorTx,
  getOrderProcessorTx,
} from "@/db/ordersProcessorTx";
import { Treasury } from "@/db/treasury";
import {
  insertTreasuryOperations,
  TreasuryOperation,
} from "@/db/treasury_operation";
import { formatCurrencyNumber } from "@/lib/currency";

export const transactionPriceCalculated = async (
  treasury: Treasury<"viva">,
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

  const transaction = await getVivaTransaction(treasury, TransactionId);

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

  const community = new CommunityConfig(Config);

  const token = community.getToken(treasury.token);

  const { data: order, error: orderError } = await createTerminalOrder(
    client,
    place.id,
    amount,
    commission,
    pos.id,
    processorTx?.id || null,
    token.address
  );

  if (orderError || !order) {
    console.error("Error creating terminal order", orderError);
    return NextResponse.json({ received: true });
  }

  let mintAmount = amount - commission;
  if (mintAmount < 0) {
    mintAmount = 0;
  }

  const account = place.accounts[0];
  if (!account) {
    console.error("Error getting account", account);
    return NextResponse.json({ received: true });
  }

  const createdAt = new Date(transaction.insDate);

  const message = `viva operation - ${place.display} - ${order.id} - ${transaction.bankId}`;

  const description = `Received ${token.symbol} ${formatCurrencyNumber(
    mintAmount
  )}`;

  const operation: TreasuryOperation<"payg"> = {
    id: TransactionId,
    treasury_id: treasury.id,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
    direction: "in",
    amount: mintAmount,
    status: "pending",
    message,
    metadata: {
      order_id: order.id,
      description,
    },
    tx_hash: null,
    account,
  };

  await insertTreasuryOperations(client, [operation]);

  return NextResponse.json({ received: true });
};
