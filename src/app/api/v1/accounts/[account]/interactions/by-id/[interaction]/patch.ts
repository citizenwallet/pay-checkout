import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import {
  updateInteractionOfAccount,
  UpdateableInteractionFields,
} from "@/db/interactions";

/**
 * PATCH /api/v1/accounts/[account]/interactions/by-id/[interaction]
 *
 * Updates specific fields of a given interaction.
 *
 * @param account - The public address of the user who owns the interaction
 * @param interaction - The ID of the interaction to update
 * @param body.new_interaction - Boolean flag indicating if interaction is new/unread
 *
 * @returns {Object} Response
 * @returns {Object} Response.interaction - The updated interaction data
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Request Body
 * {
 *   "new_interaction": false
 * }
 *
 * // Success Response
 * {
 *   "interaction": {
 *     "id": "...",
 *     "new_interaction": false
 *   }
 * }
 *
 * // Error Response
 * {
 *   "error": "No account",
 *   "status": 400
 * }
 */

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ account: string; interaction: string }> }
) {
  const { account, interaction } = await context.params;

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  if (!interaction) {
    return NextResponse.json({ error: "No interaction" }, { status: 400 });
  }

  const body = await request.json();
  const updates: UpdateableInteractionFields = {};

  if ("new_interaction" in body) {
    if (typeof body.new_interaction !== "boolean") {
      return NextResponse.json(
        { error: "Invalid new_interaction value" },
        { status: 400 }
      );
    }
    updates.new_interaction = body.new_interaction;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  try {
    const updatedInteraction = await updateInteractionOfAccount(
      client,
      account,
      interaction,
      updates
    );

    return NextResponse.json(
      { interaction: updatedInteraction },
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
