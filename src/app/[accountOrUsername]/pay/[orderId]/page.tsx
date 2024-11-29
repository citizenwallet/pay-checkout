import { getServiceRoleClient } from "@/db";
import { getItemsForPlace, Item } from "@/db/items";
import { attachTxHashToOrder, getOrder } from "@/db/orders";
import Summary from "./Summary";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{ tx?: string }>;
}) {
  const { accountOrUsername, orderId } = await params;
  const { tx } = await searchParams;

  const client = getServiceRoleClient();
  const { data, error } = await getOrder(client, orderId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>Order not found</div>;
  }

  if (data.status === "paid") {
    return <div>Order {orderId} completed</div>;
  }

  if (!data.tx_hash && tx) {
    data.tx_hash = tx;
    await attachTxHashToOrder(client, orderId, tx);
  }

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    data.place_id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  if (!items) {
    return <div>Items not found</div>;
  }

  const community = new CommunityConfig(Config);

  return (
    <Summary
      accountOrUsername={accountOrUsername}
      order={data}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      currencyLogo={community.community.logo}
      tx={tx}
      rpcUrl={community.primaryRPCUrl}
    />
  );
}
