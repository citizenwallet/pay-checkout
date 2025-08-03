import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getTransactionsForAccount } from "@/db/transactions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const account = searchParams.get("account");
  const contract = searchParams.get("contract");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const {
      data: transactions,
      count,
      error,
    } = await getTransactionsForAccount(
      client,
      account,
      contract ?? undefined,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        transactions,
        total: count,
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
