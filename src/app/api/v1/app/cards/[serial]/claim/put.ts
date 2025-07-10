import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { claimCard, getCardBySerial } from "@/db/cards";

interface ClaimRequest {
  account: string;
  project: string | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    // Extract the accountOrUsername from the params object
    const { serial } = await params;

    const body = await request.json();
    const { account, project } = body as ClaimRequest;

    const community = new CommunityConfig(Config);

    try {
      const verifiedAccount = await verifyConnectedHeaders(
        community,
        request.headers
      );

      if (!verifiedAccount) {
        throw new Error("Invalid signature");
      }

      if (account && account.toLowerCase() !== verifiedAccount.toLowerCase()) {
        return NextResponse.json(
          { error: "Account mismatch" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(serial, project, account)) {
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

    if (
      card !== null &&
      card.owner !== null &&
      card.owner.toLowerCase() !== account.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Card already claimed" },
        { status: 400 }
      );
    }

    const { data: claimedCard, error: claimedCardError } = await claimCard(
      client,
      serial,
      project,
      account,
      null
    );

    if (claimedCardError) {
      return NextResponse.json(
        { error: claimedCardError.message },
        { status: 400 }
      );
    }

    if (claimedCard === null) {
      return NextResponse.json(
        { error: "Failed to claim card" },
        { status: 500 }
      );
    }

    return NextResponse.json(claimedCard, { status: 200 });
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
function isValidRequestData(
  serial: string,
  project: string | null,
  account: string | null
): boolean {
  return (
    typeof serial === "string" &&
    serial.length > 0 &&
    (project === null || typeof project === "string") &&
    typeof account === "string" &&
    account.length > 0
  );
}
