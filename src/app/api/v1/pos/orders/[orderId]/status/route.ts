import { getServiceRoleClient } from "@/db";
import { NextResponse } from "next/server";
import { getOrderWithBusiness, getOrderStatus } from "@/db/orders";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { verifyPosAuth } from "../../../auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const parsedOrderId = parseInt(orderId);
  if (isNaN(parsedOrderId)) {
    return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
  }

  const client = getServiceRoleClient();

  try {
    const community = new CommunityConfig(Config);

    const verifiedAccount = await verifyConnectedHeaders(
      community,
      request.headers
    );

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }

    const { data: order, error: orderError } = await getOrderWithBusiness(
      client,
      parsedOrderId
    );
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    await verifyPosAuth(order.place_id, verifiedAccount);
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  const { data: status, error } = await getOrderStatus(client, parsedOrderId);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!status) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ status });
}
