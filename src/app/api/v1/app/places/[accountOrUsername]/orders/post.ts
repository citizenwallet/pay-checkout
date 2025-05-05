import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { createAppOrder } from "@/db/orders";
import { getItemsForPlace } from "@/db/items";
import { getPlaceId } from "@/lib/place";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountOrUsername: string }> }
) {
  try {
    // Extract the accountOrUsername from the params object
    const { accountOrUsername } = await params;

    const body = await request.json();
    const { items = [], description, total, account, txHash } = body;

    try {
      const community = new CommunityConfig(Config);

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

    if (
      !isValidRequestData(
        accountOrUsername,
        items,
        description,
        total,
        account,
        txHash
      )
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (!isValidItemsFormat(items)) {
      return NextResponse.json(
        { error: "Invalid item format" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const placeId = await getPlaceId(client, accountOrUsername);
    if (!placeId) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const { data: availableItems, error } = await getItemsForPlace(
      client,
      placeId
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const availableItemIds = new Set(availableItems.map((item) => item.id));
    const invalidItem = items.find(
      (item: { id: number }) => !availableItemIds.has(item.id)
    );
    if (invalidItem) {
      return NextResponse.json(
        { error: "Invalid item ID: ${invalidItem.id}" },
        { status: 400 }
      );
    }

    const { data: orderData, error: orderError } = await createAppOrder(
      client,
      placeId,
      total,
      items,
      description,
      account,
      txHash
    );

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    return NextResponse.json(orderData, { status: 200 });
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
  accountOrUsername: string,
  items: { id: number; quantity: number }[],
  description: string | null,
  total: number,
  account: string | null,
  txHash: string
): boolean {
  return (
    typeof accountOrUsername === "string" &&
    Array.isArray(items) &&
    (description === null || typeof description === "string") &&
    typeof total === "number" &&
    (account === null || typeof account === "string") &&
    (txHash !== null || typeof txHash === "string")
  );
}

/**
 * Validates the format of items in the request
 */
function isValidItemsFormat(
  items: { id: number; quantity: number }[]
): boolean {
  return items.every(
    (item) =>
      typeof item === "object" &&
      typeof item.id === "number" &&
      typeof item.quantity === "number"
  );
}
