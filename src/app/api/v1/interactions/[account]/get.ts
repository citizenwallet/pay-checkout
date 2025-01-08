import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getInteractionsOfAccount } from "@/db/interactions";

/**
 * GET /api/v1/interactions/[account]
 *
 * Returns the latest transaction for a given account with other users or places.
 *
 * @param account - The public address of the user requesting their latest transaction
 *
 * @returns {Object} Response
 * @returns {Object} Response.interactions - The latest transaction data if found
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Request
 * GET /api/v1/interactions/0x123...
 *
 * // Success Response
 * {
 *   interactions: [
 *     {
 *       id: "...",
 *       transaction_id: "...",
 *       created_at: "..."
 *     }
 *   ]
 * }
 *
 * // Error Response
 * {
 *   error: "No account",
 *   status: 400
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> }
) {
  const { account } = await context.params;

  if (!account) {
    return NextResponse.json(
      { error: "No account" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  try {
    const interactions = await getInteractionsOfAccount(
      client,
      account
    );

    return NextResponse.json({ interactions }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get interactions" },
      { status: 500 }
    );
  }
}
