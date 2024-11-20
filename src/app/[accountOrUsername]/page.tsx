import { getServiceRoleClient } from "@/db";
import { Suspense } from "react";
import Menu from "./Menu";
import Config from "@/cw/community.json";
import { CommunityConfig } from "@citizenwallet/sdk";
import { getItemsForPlace } from "@/db/items";
import { Metadata } from "next";
import { getPlaceWithProfile } from "@/lib/place";
import { redirect } from "next/navigation";

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

  metadata.title = profile.name;
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

  return (
    <div>
      <Suspense fallback={<Menu loading />}>
        <PlacePage accountOrUsername={accountOrUsername} />
      </Suspense>
    </div>
  );
}

async function PlacePage({ accountOrUsername }: { accountOrUsername: string }) {
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

  const { data: items } = await getItemsForPlace(client, place.id);

  return (
    <Menu
      accountOrUsername={accountOrUsername}
      place={place}
      profile={profile}
      items={items ?? []}
      currencyLogo={community.community.logo}
    />
  );
}
