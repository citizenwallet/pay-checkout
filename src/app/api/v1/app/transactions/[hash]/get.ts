import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getTransactionByHash } from "@/db/transactions";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params;

  if (!hash) {
    return NextResponse.json({ error: "No hash" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const { data: transaction, error } = await getTransactionByHash(
      client,
      hash
    );

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        transaction,
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
