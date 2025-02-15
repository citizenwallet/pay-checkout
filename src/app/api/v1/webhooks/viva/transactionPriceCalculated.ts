import { getTerminalOrderByTransactionId, updateOrderFees } from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { VivaTransactionPriceCalculated } from "@/viva";

export const transactionPriceCalculated = async (
  data: VivaTransactionPriceCalculated
) => {
  const { TransactionId, TotalCommission = 0 } = data;

  console.log("TransactionId", TransactionId);

  // Wait for 1 second to ensure the order is created
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const client = getServiceRoleClient();
  const { data: orders, error: orderError } =
    await getTerminalOrderByTransactionId(client, TransactionId);

  if (orderError || !orders) {
    console.error("Error getting order", orderError);
    return;
  }

  console.log("Orders", orders);

  for (const order of orders) {
    await updateOrderFees(client, order.id, TotalCommission * 100);
  }
};
