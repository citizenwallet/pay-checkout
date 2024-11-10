import { getServiceRoleClient } from "@/db";
import VendorOrders from "./Orders";
import { Suspense } from "react";
import { getOrdersByPlace } from "@/db/orders";
import { getProfileFromUsername } from "@citizenwallet/sdk";
import { getPlaceByUsername } from "@/db/places";
import { getProfileFromAddress } from "@citizenwallet/sdk";
import { getPlacesByAccount } from "@/db/places";
import { CommunityConfig } from "@citizenwallet/sdk";
import { Profile } from "@citizenwallet/sdk";
import { Place } from "@/db/places";
import Config from "@/cw/community.json";
import { getItemsForPlace, Item } from "@/db/items";

export default async function Page({
  params,
}: {
  params: Promise<{ accountOrUsername: string }>;
}) {
  const { accountOrUsername } = await params;
  const community = new CommunityConfig(Config);

  return (
    <Suspense
      fallback={
        <VendorOrders loading currencyLogo={community.community.logo} />
      }
    >
      <OrdersPage accountOrUsername={accountOrUsername} />
    </Suspense>
  );
}

async function OrdersPage({
  accountOrUsername,
}: {
  accountOrUsername: string;
}) {
  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  let place: Place | null = null;
  let profile: Profile | null = null;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlacesByAccount(client, accountOrUsername);
    place = data?.[0] ?? null;

    profile = place
      ? await getProfileFromAddress(community, accountOrUsername)
      : null;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;

    profile = place
      ? await getProfileFromUsername(community, accountOrUsername)
      : null;
  }

  if (!place) {
    return <div>Place not found</div>;
  }

  const { data } = await getOrdersByPlace(client, place.id);

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    place.id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  return (
    <VendorOrders
      initialOrders={data ?? []}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      placeId={place.id}
      profile={profile}
      currencyLogo={community.community.logo}
    />
  );
}
