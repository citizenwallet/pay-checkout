import {
  createTerminalFeeOrder,
  getTerminalOrderByTransactionId,
  updateOrderFees,
} from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { VivaTransactionPriceCalculated } from "@/viva";
import { getTransaction } from "@/viva/transactions";

export const transactionPriceCalculated = async (
  data: VivaTransactionPriceCalculated
) => {
  const { TransactionId, TotalCommission = 0 } = data;

  const basicAuth = Buffer.from(
    `${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_API_KEY}`
  ).toString("base64");

  const transaction = await getTransaction(basicAuth, TransactionId);

  if (!transaction) {
    console.error("Transaction not found", TransactionId);
    return;
  }

  console.log("TransactionId", TransactionId);

  const totalCommission = Number((TotalCommission * 100).toFixed(0));

  console.log("totalCommission", totalCommission);

  const client = getServiceRoleClient();
  const { data: orders, error: orderError } =
    await getTerminalOrderByTransactionId(client, TransactionId);

  if (orderError || !orders || orders.length === 0) {
    const { data: order, error: orderError } = await createTerminalFeeOrder(
      client,
      totalCommission,
      `Order: ${TransactionId}`
    );

    if (orderError || !order) {
      console.error("Error creating terminal order", orderError);
    }

    return;
  }

  console.log("Orders", orders);

  for (const order of orders) {
    await updateOrderFees(client, order.id, totalCommission);
  }
};
