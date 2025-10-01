import { getServiceRoleClient } from "@/db";
import { NextResponse } from "next/server";
import { getOrder } from "@/db/orders";
import { checkApiKey } from "@/db/apiKeys";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headersList = request.headers;
  const apiKey = headersList.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key specified" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  const ok = await checkApiKey(client, apiKey, ["orders"]);
  if (!ok) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "No orderId provided" }, { status: 400 });
  }

  const parsedOrderId = parseInt(orderId);
  if (isNaN(parsedOrderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const { data: order, error } = await getOrder(client, parsedOrderId);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order, { status: 200 });
}
