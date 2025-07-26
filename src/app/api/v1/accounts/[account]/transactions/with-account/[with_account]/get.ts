import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getTransactionsBetweenAccounts } from "@/db/transactions";

/**
 * GET /api/v1/accounts/[account]/transactions/with-account/[with_account]
 *
 * Gets all transactions between the given account and another specified account.
 *
 * @param account - The public address of the first user
 * @param with_account - The public address of the second user
 *
 * @returns {Object} Response
 * @returns {Object[]} Response.transactions - Array of transaction data between the accounts
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Success Response
 * {
 *   "transactions": [
 *     {
 *       "id": "123",
 *       "from_account": "0x...",
 *       "to_account": "0x...",
 *       "amount": "1.5",
 *       "timestamp": "2023-01-01T12:00:00Z"
 *     }
 *   ]
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
  context: { params: Promise<{ account: string; with_account: string }> }
) {
  const { account, with_account } = await context.params;

  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get("limit") ?? "10");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  if (!with_account) {
    return NextResponse.json({ error: "No with_account" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const {
      data: transactions,
      count,
      error,
    } = await getTransactionsBetweenAccounts(
      client,
      account,
      with_account,
      limit,
      offset
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        transactions,
        count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to patch interaction" },
      { status: 500 }
    );
  }
}
