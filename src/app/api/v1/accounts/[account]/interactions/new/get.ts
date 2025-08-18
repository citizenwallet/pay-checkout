import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getNewInteractionsOfAccount } from "@/db/interactions";

/**
 * GET /api/v1/accounts/[account]/interactions/new?from_date
 *
 * Returns any new interactions for a given account since the specified from_date.
 * Used for polling new interaction updates.
 *
 * @param account - The public address or username of the user requesting their interactions
 * @param from_date - ISO date string to get interactions newer than this date
 *
 * @returns {Object} Response
 * @returns {Object[]} Response.interactions - Array of interaction objects newer than from_date
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Success Response
 * {
 *   interactions: [
 *     {
 *       id: "...",
 *       transaction_id: "...",
 *       created_at: "2023-10-20T15:35:00Z"
 *     }
 *   ]
 * }
 *
 * // Error Response
 * {
 *   error: "No accountOrUsername",
 *   status: 400
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> }
) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const { account } = await context.params;
  const fromDateParam = request.nextUrl.searchParams.get("from_date");

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  let fromDate = new Date();
  if (fromDateParam) {
    fromDate = new Date(fromDateParam);
  }

  const client = getServiceRoleClient();

  try {
    const interactions = await getNewInteractionsOfAccount(
      client,
      account,
      fromDate,
      token
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
