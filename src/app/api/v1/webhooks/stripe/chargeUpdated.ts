import { getServiceRoleClient } from "@/db";
import { updateOrderFees } from "@/db/orders";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const chargeUpdated = async (stripe: Stripe, event: Stripe.Event) => {
  const charge = event.data.object as Stripe.Charge;

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

  const client = getServiceRoleClient();

  await updateOrderFees(client, orderId, fees);
};
