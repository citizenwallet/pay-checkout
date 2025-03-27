import { getServiceRoleClient } from "@/db";
import { deleteOrder, getOrdersByPlace } from "@/db/orders";
import { CommunityConfig, waitForTxSuccess } from "@citizenwallet/sdk";
import Config from "../src/cw/community.json";

export const cleanUpFailedTxOrders = async () => {
  const client = getServiceRoleClient();

  const community = new CommunityConfig(Config);

  const { data: orders, error } = await getOrdersByPlace(client, 1, 4000);
  if (error) {
    throw error;
  }

  for (const order of orders) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!order.tx_hash) {
      console.log(`Order ${order.id} does not have a tx hash`);
      continue;
    }

    const shortTxHash =
      order.tx_hash.slice(0, 6) + "..." + order.tx_hash.slice(-4);

    console.log(`Order ${order.id} ${shortTxHash}...`);
    const success = await waitForTxSuccess(community, order.tx_hash, 4000);

    if (!success) {
      console.log(`Order ${order.id} ${shortTxHash} deleting...`);
      await deleteOrder(client, order.id);
      continue;
    }

    console.log(`Order ${order.id} ${shortTxHash} is ok`);
  }
};
