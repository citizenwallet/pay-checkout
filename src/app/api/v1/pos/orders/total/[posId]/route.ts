import { getServiceRoleClient } from "@/db";
import { getPlaceId } from "@/lib/place";
import { NextResponse } from "next/server";
import { getTodayOrdersByPlaceByPosId } from "@/db/orders";
import { CommunityConfig } from "@citizenwallet/sdk";
import { verifyPosAuth } from "../../../auth";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? undefined;
  const account = searchParams.get("account") ?? undefined;
  const inviteCode = searchParams.get("inviteCode") ?? undefined;
  const username = searchParams.get("username") ?? undefined;
  const placeId = searchParams.get("placeId") ?? null;
  const tokenAddress = searchParams.get("token") ?? null;

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

  const community = new CommunityConfig(Config);

  const token = community.getToken(tokenAddress ?? undefined);

  let posId: string | null = null;
  try {
    const verifiedAccount = await verifyConnectedHeaders(
      community,
      request.headers
    );

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }

    posId = await verifyPosAuth(parseInt(parsedPlaceId), verifiedAccount);
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  if (!posId) {
    return NextResponse.json({ error: "Pos not found" }, { status: 404 });
  }

  const { data } = await getTodayOrdersByPlaceByPosId(
    client,
    parseInt(parsedPlaceId),
    posId,
    token.address
  );

  if (!data) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  const totalAmount = data.reduce(
    (acc, order) =>
      acc +
      (order.status === "correction" || order.status === "refund"
        ? order.total * -1
        : order.total),
    0
  );
  const totalFees = data.reduce(
    (acc, order) =>
      acc + (order.status === "correction" ? order.fees * -1 : order.fees),
    0
  );

  const totalNet = totalAmount - totalFees;

  return NextResponse.json({ totalAmount, totalFees, totalNet });
}
