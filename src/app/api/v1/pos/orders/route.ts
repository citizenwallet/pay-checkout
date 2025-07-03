import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { createPosOrder } from "@/db/orders";
import { getItemsForPlace } from "@/db/items";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { verifyPosAuth } from "../auth";

/**
 * POST /api/v1/accounts/[account]/orders/createOrder
 *
 * Creates a new order for a specific place with the given items and details.
 *
 * @param {Object} request - The Next.js request object containing the order details
 * @param {Object} request.body - The request body containing order information
 * @param {number} request.body.placeId - The ID of the place where the order is being created
 * @param {Array} request.body.items - Array of items in the order
 * @param {string} request.body.description - Description of the order
 * @param {number} request.body.total - Total amount of the order
 * @param {string|null} request.body.account - The account address associated with the order
 * @param {string|null} request.body.type - The type of order (web, app, terminal, or pos)
 *
 * @returns {Object} Response object containing either:
 *   - Success: { data: { id: number } } with status 200
 *   - Error: { error: string, status: number } with appropriate error status
 *
 * @example
 * // Request body
 * {
 *   "placeId": 123,
 *   "items": [
 *     { "id": 456, "quantity": 2 }
 *   ],
 *   "description": "Coffee and pastry",
 *   "total": 25.50,
 *   "account": "0x...",
 *   "type": "web"
 * }
 *
 * // Success Response
 * {
 *   "data": { "id": 789 }
 * }
 *
 * // Error Response
 * {
 *   "error": "Invalid request data",
 *   "status": 400
 * }
 */

interface OrderRequest {
  placeId: number;
  items: { id: number; quantity: number }[];
  description: string;
  total: number;
  posId: string;
  type: "web" | "app" | "terminal" | "pos";
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      placeId,
      items,
      description,
      total,
      posId,
      token: tokenAddress,
    } = body as OrderRequest;

    const community = new CommunityConfig(Config);

    const token = community.getToken(tokenAddress ?? undefined);

    try {
      const verifiedAccount = await verifyConnectedHeaders(
        community,
        request.headers
      );

      if (!verifiedAccount) {
        throw new Error("Invalid signature");
      }

      await verifyPosAuth(placeId, verifiedAccount);
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(placeId, items, description, total)) {
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

    const { data: orderData, error: orderError } = await createPosOrder(
      client,
      placeId,
      total,
      items,
      description,
      null,
      posId,
      null,
      token.address
    );

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    console.log("orderData", orderData);

    return NextResponse.json({ orderId: orderData.id }, { status: 200 });
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
  placeId: number,
  items: { id: number; quantity: number }[],
  description: string,
  total: number
): boolean {
  return (
    typeof placeId === "number" &&
    Array.isArray(items) &&
    typeof description === "string" &&
    typeof total === "number"
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
