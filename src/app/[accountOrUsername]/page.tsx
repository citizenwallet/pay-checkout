import { getPlacesByAccount, getPlaceByUsername, Place } from "@/db/places";
import { getServiceRoleClient } from "@/db";
import { Suspense } from "react";

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

  let place: Place | null = null;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlacesByAccount(client, accountOrUsername);
    place = data?.[0] ?? null;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;
  }

  if (!place) {
    return <div>Place not found</div>;
  }

  return <div>{place.name}</div>;
}
