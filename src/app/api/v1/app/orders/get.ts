import { getServiceRoleClient } from "@/db";
import { NextResponse } from "next/server";
import { getOrdersByTxHash } from "@/db/orders";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const txHash = searchParams.get("txHash");

  if (!txHash) {
    return NextResponse.json({ error: "No txHash provided" }, { status: 400 });
  }
  const client = getServiceRoleClient();

  const { data: orders, error } = await getOrdersByTxHash(client, txHash);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ orders: orders || [] }, { status: 200 });
}
