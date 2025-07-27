import { getServiceRoleClient } from "@/db";
import { getPlaceWithProfile } from "@/lib/place";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { CommunityConfig } from "@citizenwallet/sdk";

export async function GET(
  request: Request,
  context: { params: Promise<{ accountOrUsername: string }> }
) {
  const { accountOrUsername } = await context.params;
  if (!accountOrUsername) {
    return NextResponse.json(
      { error: "No accountOrUsername" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  const { place, profile } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  return NextResponse.json({ place, profile, items: place.items });
}
