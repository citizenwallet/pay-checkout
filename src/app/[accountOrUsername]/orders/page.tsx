import { getServiceRoleClient } from "@/db";
import VendorOrders from "./Orders";
import { Suspense } from "react";
import { getOrdersByPlace } from "@/db/orders";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getItemsForPlace, Item } from "@/db/items";
import { getPlaceWithProfile } from "@/lib/place";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getAccountBalance } from "@/cw/balance";

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
      icon: "/favicon.ico",
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

  metadata.title = place.name;
  metadata.description = profile?.description ?? "Pay with Brussels Pay";
  metadata.openGraph = {
    title: place.name,
    description: profile?.description ?? "Pay with Brussels Pay",
    images: [profile?.image ?? "/shop.png"],
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
      redirect(
        `${process.env.BUSINESS_INVITE_BASE_URL}?inviteCode=${accountOrUsername}`
      );
    }

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

  const balance = await getAccountBalance(profile?.account ?? "");

  return (
    <VendorOrders
      initialOrders={data ?? []}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      placeId={place.id}
      place={place}
      profile={profile}
      currencyLogo={community.community.logo}
      initialBalance={Number(balance ?? 0)}
    />
  );
}
