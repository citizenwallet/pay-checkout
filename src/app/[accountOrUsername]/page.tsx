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

export default async function Page({
  params,
}: {
  params: Promise<{ accountOrUsername: string }>;
}) {
  const { accountOrUsername } = await params;

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PlacePage accountOrUsername={accountOrUsername} />
      </Suspense>
    </div>
  );
}

async function PlacePage({ accountOrUsername }: { accountOrUsername: string }) {
  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  console.log(community);

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

  console.log(profile);

  if (!place) {
    return <div>Place not found</div>;
  }

  // return <Menu place={place} />;
  return <Menu place={place} profile={profile} />;
}
