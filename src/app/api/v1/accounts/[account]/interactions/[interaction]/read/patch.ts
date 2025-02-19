import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { setInteractionAsRead } from "@/db/interactions";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ account: string; interaction: string }> }
) {
  const { account, interaction } = await context.params;

  // TODO: auth

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  if (!interaction) {
    return NextResponse.json({ error: "No interaction" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const updatedInteraction = await setInteractionAsRead(
      client,
      account,
      interaction
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
