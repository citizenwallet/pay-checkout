import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getCardsByOwner } from "@/db/cards";
import { CommunityConfig, verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const community = new CommunityConfig(Config);

  let verifiedAccount: string | null = null;
  try {
    verifiedAccount = await verifyConnectedHeaders(community, request.headers);

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  if (!verifiedAccount) {
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  const owner = searchParams.get("owner");

  if (!owner) {
    return NextResponse.json({ error: "No owner specified" }, { status: 400 });
  }

  if (verifiedAccount.toLowerCase() !== owner.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getServiceRoleClient();

  try {
    const { data: cards, count } = await getCardsByOwner(client, owner);

    return NextResponse.json(
      {
        cards,
        total: count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
