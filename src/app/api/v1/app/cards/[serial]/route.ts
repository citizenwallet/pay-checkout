import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getCardBySerial } from "@/db/cards";
import { CommunityConfig, verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;

  if (!serial) {
    return NextResponse.json({ error: "No serial specified" }, { status: 400 });
  }

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

  const client = getServiceRoleClient();

  try {
    const { data: card, error } = await getCardBySerial(client, serial);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (card === null) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (
      card.owner &&
      card.owner.toLowerCase() !== verifiedAccount.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        card,
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
