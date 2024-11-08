import { getPlacesByAccount, getPlaceByUsername, Place } from "@/db/places";
import { getServiceRoleClient } from "@/db";
import { Suspense } from "react";
import Menu from "./Menu";
import Config from "@/cw/community.json";
import {
  CommunityConfig,
  getProfileFromAddress,
  getProfileFromUsername,
  Profile,
} from "@citizenwallet/sdk";
import { getItemsForPlace } from "@/db/items";
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

  const community = new CommunityConfig(Config);

  let profile: Profile | null = null;
  if (accountOrUsername.startsWith("0x")) {
    profile = await getProfileFromAddress(community, accountOrUsername);
  } else {
    profile = await getProfileFromUsername(community, accountOrUsername);
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
