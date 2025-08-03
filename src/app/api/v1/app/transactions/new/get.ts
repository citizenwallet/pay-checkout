import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getNewTransactionsForAccount } from "@/db/transactions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const account = searchParams.get("account");
  const contract = searchParams.get("contract");
  const fromDateParam = searchParams.get("from_date");

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  let fromDate = new Date();
  if (fromDateParam) {
    fromDate = new Date(fromDateParam);
  }

  const client = getServiceRoleClient();

  try {
    const {
      data: transactions,
      error,
      count,
    } = await getNewTransactionsForAccount(
      client,
      account,
      fromDate,
      contract ?? undefined
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
