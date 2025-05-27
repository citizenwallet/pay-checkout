import { getServiceRoleClient } from "@/db";
import { getItemsForPlace } from "@/db/items";
import { getPlaceWithProfile } from "@/lib/place";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { CommunityConfig, verifyConnectedHeaders } from "@citizenwallet/sdk";
import { verifyPosAuth } from "../../../auth";

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

  try {
    const community = new CommunityConfig(Config);

    const verifiedAccount = await verifyConnectedHeaders(
      community,
      request.headers
    );

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }

    await verifyPosAuth(place.id, verifiedAccount);
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  const { data } = await getItemsForPlace(client, place.id);

  return NextResponse.json({ place, profile, items: data });
}
