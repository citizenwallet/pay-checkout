import { getServiceRoleClient } from "@/db";
import { getPlaceId } from "@/lib/place";
import { NextResponse } from "next/server";
import { getOrdersByPlace } from "@/db/orders";
import { CommunityConfig } from "@citizenwallet/sdk";
import { verifyPosAuth } from "../../auth";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? undefined;
  const account = searchParams.get("account") ?? undefined;
  const inviteCode = searchParams.get("inviteCode") ?? undefined;
  const username = searchParams.get("username") ?? undefined;
  const placeId = searchParams.get("placeId") ?? null;

  const client = getServiceRoleClient();

  let parsedPlaceId: string | null = placeId;
  if (!parsedPlaceId) {
    const accountOrUsername = slug ?? account ?? inviteCode ?? username;

    if (!accountOrUsername) {
      return NextResponse.json(
        { error: "No slug, account, inviteCode, or username" },
        { status: 400 }
      );
    }

    const id = await getPlaceId(client, accountOrUsername);
    if (!id) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    parsedPlaceId = id.toString();
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

    await verifyPosAuth(parseInt(parsedPlaceId), verifiedAccount);
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  const { data } = await getOrdersByPlace(client, parseInt(parsedPlaceId), 20);

  return NextResponse.json({ orders: data });
}
