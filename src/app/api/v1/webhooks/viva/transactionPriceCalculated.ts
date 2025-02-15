import {
  createTerminalFeeOrder,
  getTerminalOrderByTransactionId,
  updateOrderFees,
} from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { VivaTransactionPriceCalculated } from "@/viva";

export const transactionPriceCalculated = async (
  data: VivaTransactionPriceCalculated
) => {
  const { TransactionId, TotalCommission = 0 } = data;

  console.log("TransactionId", TransactionId);

  const totalCommission = Number((TotalCommission * 100).toFixed(0));

  console.log("totalCommission", totalCommission);

  const client = getServiceRoleClient();
  const { data: orders, error: orderError } =
    await getTerminalOrderByTransactionId(client, TransactionId);

  if (orderError || !orders) {
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
