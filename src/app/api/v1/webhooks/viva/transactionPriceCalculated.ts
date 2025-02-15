import { getTerminalOrderByTransactionId, updateOrderFees } from "@/db/orders";
import { getServiceRoleClient } from "@/db";
import { VivaTransactionPriceCalculated } from "@/viva";

export const transactionPriceCalculated = async (
  data: VivaTransactionPriceCalculated
) => {
  const { TransactionId, TotalCommission = 0 } = data;

  const client = getServiceRoleClient();
  const { data: order, error: orderError } =
    await getTerminalOrderByTransactionId(client, TransactionId);

  if (orderError || !order) {
    console.error("Error getting order", orderError);
    return;
  }

  await updateOrderFees(client, order.id, TotalCommission * 100);
};
