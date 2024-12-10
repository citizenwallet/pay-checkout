import { getServiceRoleClient } from "@/db";
import { getItemsForPlace } from "@/db/items";
import { getOrder } from "@/db/orders";
import Success from "./Success";
import { Item } from "@/db/items";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { track } from "@vercel/analytics/server";
import { getPlace } from "@/lib/place";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{ tx?: string; close?: string }>;
}) {
  const { accountOrUsername, orderId } = await params;
  const { tx, close } = await searchParams;

  const client = getServiceRoleClient();
  const { data, error } = await getOrder(client, orderId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    data.place_id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  const community = new CommunityConfig(Config);

  const { place } = await getPlace(client, accountOrUsername);
  if (place) {
    await track("order_paid", {
      slug: place.slug,
      amount: data.total,
    });
  }

  return (
    <Success
      accountOrUsername={accountOrUsername}
      order={data}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      currencyLogo={community.community.logo}
      tx={tx}
      close={close}
    />
  );
}
