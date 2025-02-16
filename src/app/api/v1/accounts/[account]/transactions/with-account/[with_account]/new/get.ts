import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getNewTransactionsBetweenAccounts } from "@/db/transactions";

/**
 * GET /api/v1/accounts/[account]/transactions/with-account/[with_account]/new?from_date=
 *
 * Polls for transactions between two accounts since a given date. Used to check for new interactions
 * between accounts.
 *
 * @param account - The public address of the first user
 * @param with_account - The public address of the second user
 * @param from_date - ISO date string to get transactions from (e.g. "2023-01-01T00:00:00Z")
 *
 * @returns {Object} Response
 * @returns {Object[]} Response.transactions - Array of transaction data between the accounts since the from date
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
  const fromDateParam = request.nextUrl.searchParams.get("from_date");

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  if (!with_account) {
    return NextResponse.json({ error: "No with_account" }, { status: 400 });
  }

  let fromDate = new Date();
  if (fromDateParam) {
    fromDate = new Date(fromDateParam);
  }

  const client = getServiceRoleClient();

  try {
    const transactions = await getNewTransactionsBetweenAccounts(
      client,
      account,
      with_account,
      fromDate
    );

    console.log("transactions", transactions.length);

    return NextResponse.json(
      {
        transactions,
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
