import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getProfilesByAccounts } from "@/db/profiles";

/**
 * GET /api/v1/accounts/[account]/profile
 *
 * Gets the profile information for a given account.
 *
 * @param account - The public address of the user whose profile to retrieve
 *
 * @returns {Object} Response
 * @returns {Object} Response.profile - The profile data
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Success Response
 * {
 *   "profile": {
 *     "account": "0x...",
 *     "username": "alice",
 *     "name": "Alice",
 *     "description": "Hello world",
 *     "image": "https://..."
 *   }
 * }
 *
 * // Error Response
 * {
 *   "error": "No account",
 *   "status": 400
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> }
) {
  const { account } = await context.params;

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const { data, error } = await getProfilesByAccounts(client, [account]);

    if (error) {
      return NextResponse.json(
        { error: "Failed to get profile" },
        { status: 500 }
      );
    }

    const oneProfile = data[0];

    return NextResponse.json(
      {
        profile: {
          account: oneProfile.account,
          username: oneProfile.username,
          name: oneProfile.name,
          description: oneProfile.description,
          image: oneProfile.image,
          place_id: oneProfile.place_id,
        },
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
