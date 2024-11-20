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

  const { profile, inviteCode } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

  if (inviteCode && !profile) {
    metadata.title = "Join Brussels Pay";
    metadata.description = "Verify your business to activate this code.";
    metadata.openGraph = {
      title: "Join Brussels Pay",
      description: "Verify your business to activate this code.",
      images: ["/shop.png"],
    };
    return metadata;
  }

  if (!profile) {
    return metadata;
  }

  metadata.title = `${profile.name} - Orders`;
  metadata.description = profile.description;
  metadata.openGraph = {
    title: profile.name,
    description: profile.description,
    images: [profile.image],
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
