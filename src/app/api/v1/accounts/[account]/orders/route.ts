import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getOrdersByAccount } from "@/db/orders";

/**
 * GET /api/v1/accounts/[account]/orders
 *
 * Gets all orders for the given account with pagination.
 *
 * @param account - The public address of the user
 * @param limit - Optional number of orders to return (default: 10)
 * @param offset - Optional offset for pagination (default: 0)
 * @param placeId - Optional place ID to filter orders by
 *
 * @returns {Object} Response
 * @returns {Object[]} Response.orders - Array of order data
 * @returns {number} Response.total - Total number of orders
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Success Response
 * {
 *   "orders": [
 *     {
 *       "id": 123,
 *       "created_at": "2024-01-01T12:00:00Z",
 *       "completed_at": "2024-01-01T12:05:00Z",
 *       "total": 25.50,
 *       "due": 0,
 *       "place_id": 456,
 *       "items": [{ "id": 789, "quantity": 2 }],
 *       "status": "paid",
 *       "description": "Coffee and pastry",
 *       "tx_hash": "0x...",
 *       "account": "0x..."
 *     }
 *   ],
 *   "total": 50
 * }
 *
 * // Error Response
 * {
 *   "error": "No account specified",
 *   "status": 400
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> }
) {
  const { account } = await context.params;
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get("limit") ?? "10");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const placeId = searchParams.get("placeId");

  if (!account) {
    return NextResponse.json(
      { error: "No account specified" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  try {
    const { data: orders, count } = await getOrdersByAccount(
      client,
      account,
      limit,
      offset,
      placeId ? parseInt(placeId) : undefined
    );

    return NextResponse.json(
      {
        orders,
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
