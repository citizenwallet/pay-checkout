import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getCardBySerial, unclaimCard } from "@/db/cards";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    // Extract the accountOrUsername from the params object
    const { serial } = await params;

    const community = new CommunityConfig(Config);

    let verifiedAccount: string | null = null;
    try {
      verifiedAccount = await verifyConnectedHeaders(
        community,
        request.headers
      );

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

    if (verifiedAccount === null) {
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(serial)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const { data: card, error: cardError } = await getCardBySerial(
      client,
      serial
    );

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    if (card === null) {
      return NextResponse.json({ error: "Card not claimed" }, { status: 400 });
    }

    if (card !== null && card.owner === null) {
      return NextResponse.json({ error: "Card not claimed" }, { status: 400 });
    }

    if (
      card !== null &&
      card.owner !== null &&
      card.owner.toLowerCase() !== verifiedAccount.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Card not owned by account" },
        { status: 401 }
      );
    }

    const { error: claimedCardError } = await unclaimCard(client, serial);

    if (claimedCardError) {
      return NextResponse.json(
        { error: claimedCardError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(null, { status: 200 });
  } catch (err) {
    console.error("Error in generate-order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Validates the request data types and format
 */
function isValidRequestData(serial: string): boolean {
  return typeof serial === "string" && serial.length > 0;
}
