import { getServiceRoleClient } from "@/db";
import { getOrdersByPlace, updateOrderFees } from "@/db/orders";
import { getFullTransaction } from "@/viva/transactions";

export const migrateVivaOrderFees = async () => {
  const client = getServiceRoleClient();

  const { data: orders, error } = await getOrdersByPlace(client, 13, 4000);
  if (error) {
    throw error;
  }

  for (const order of orders) {
    if (order.fees > 0) {
      console.log(`Order ${order.id} already has fees`);
      continue;
    }

    if (!order.description?.startsWith("Order: ")) {
      console.log(`Order ${order.id} has no description`);
      continue;
    }

    if (order.type !== "terminal") {
      console.log(`Order ${order.id} is not a terminal order`);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, transactionId] = order.description.split("Order: ");
    if (!transactionId) {
      console.log(`Order ${order.id} has no transaction id`);
      continue;
    }

    const transaction = await getFullTransaction(transactionId);
    if (!transaction) {
      console.log(`Order ${order.id} has no transaction`);
      continue;
    }

    if (transaction.Commission === 0) {
      console.log(`Order ${order.id} has no commission`);
      continue;
    }

    console.log(
      `Order ${order.id} updating fees to: ${transaction.Commission}`
    );
    await updateOrderFees(
      client,
      order.id,
      Number((transaction.Commission * 100).toFixed(0))
    );
  }
};
