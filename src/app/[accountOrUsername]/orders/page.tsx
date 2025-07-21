import { getServiceRoleClient } from "@/db";
import VendorOrders from "./Orders";
import { Suspense } from "react";
import { getOrdersByPlace } from "@/db/orders";
import { CommunityConfig, getAccountBalance } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getItemsForPlace, Item } from "@/db/items";
import { getPlaceWithProfile } from "@/lib/place";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AProfile } from "@/db/profiles";
import { loadProfileMapFromHashesAction } from "@/app/actions/loadProfileMapFromHashes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountOrUsername: string }>;
}): Promise<Metadata> {
  const { accountOrUsername } = await params;
  const metadata: Metadata = {
    title: "Place not found",
    description: "This place has not been claimed yet.",
    icons: {
      icon: `/favicon/${accountOrUsername}`,
    },
    openGraph: {
      title: "Place not found",
      description: "This place has not been claimed yet.",
      images: ["/shop.png"],
    },
  };

  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  const { place, profile, inviteCode } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

  if (inviteCode && !place) {
    metadata.title = "Join Brussels Pay";
    metadata.description = "Verify your business to activate this code.";
    metadata.icons = {
      icon: `/favicon/${accountOrUsername}`,
    };
    metadata.openGraph = {
      title: "Join Brussels Pay",
      description: "Verify your business to activate this code.",
      images: ["/shop.png"],
    };
    return metadata;
  }

  if (!place) {
    return metadata;
  }

  const faviconImage = place.image ?? profile?.image ?? "/shop.png";

  metadata.title = place.name;
  metadata.description = profile?.description ?? "Pay with Brussels Pay";
  metadata.icons = {
    icon: `/favicon/${accountOrUsername}`,
  };
  metadata.openGraph = {
    title: place.name,
    description: profile?.description ?? "Pay with Brussels Pay",
    images: [faviconImage],
    type: "website",
  };

  return metadata;
}

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

  const { place, profile, inviteCode } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

  if (!place) {
    if (inviteCode) {
      redirect(`/${accountOrUsername}/join`);
    }

    return <div>Place not found</div>;
  }

  const { data } = await getOrdersByPlace(client, place.id);

  let profiles: { [key: string]: AProfile } = {};
  if ((data ?? []).length > 0) {
    profiles = await loadProfileMapFromHashesAction(
      (data ?? [])
        .filter((order) => order.tx_hash != null && order.tx_hash != "")
        .map((order) => order.tx_hash!),
      place?.display === "topup" ? "to" : "from"
    );
  }

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    place.id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  const balance = await getAccountBalance(community, place.accounts[0] ?? "");

  const balanceWithDecimals = balance
    ? Number(balance) / 10 ** community.primaryToken.decimals
    : 0;

  return (
    <VendorOrders
      initialOrders={data ?? []}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      accountOrUsername={accountOrUsername}
      placeId={place.id}
      place={place}
      profile={profile}
      initialProfiles={profiles}
      currencyLogo={community.community.logo}
      initialBalance={balanceWithDecimals * 100}
    />
  );
}
