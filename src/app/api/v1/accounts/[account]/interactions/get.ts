import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getInteractionsOfAccount } from "@/db/interactions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> }
) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const { account } = await context.params;

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const interactions = await getInteractionsOfAccount(client, account, token);

    return NextResponse.json({ interactions }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get interactions" },
      { status: 500 }
    );
  }
}
