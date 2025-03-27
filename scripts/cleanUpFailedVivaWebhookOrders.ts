import { getServiceRoleClient } from "@/db";
import { deleteOrder, getOrdersByPlace } from "@/db/orders";

export const cleanUpFailedVivaWebhookOrders = async () => {
  const client = getServiceRoleClient();

  const { data: orders, error } = await getOrdersByPlace(client, 13, 4000);
  if (error) {
    throw error;
  }

  for (const order of orders) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (order.tx_hash) {
      console.log(`Order ${order.id} has a tx hash`);
      continue;
    }

    if (!(order.description && order.description.startsWith("Order: "))) {
      console.log(`Order ${order.id} does not have a description`);
      continue;
    }

    console.log(`Order ${order.id}...`);

    await deleteOrder(client, order.id);

    console.log(`Order ${order.id} is ok`);
  }
};
