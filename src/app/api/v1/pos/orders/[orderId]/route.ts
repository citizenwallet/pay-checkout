import { CommunityConfig } from "@citizenwallet/sdk";
import { verifyConnectedHeaders } from "@citizenwallet/sdk";
import { NextResponse, NextRequest } from "next/server";
import Config from "@/cw/community.json";
import { getServiceRoleClient } from "@/db";
import { deleteOrder, getOrderWithBusiness } from "@/db/orders";
import { verifyPosAuth } from "../../auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const client = getServiceRoleClient();

  try {
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId parameter" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await getOrderWithBusiness(
      client,
      parseInt(orderId)
    );
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order is not cancellable" },
        { status: 400 }
      );
    }

    try {
      const community = new CommunityConfig(Config);

      const verifiedAccount = await verifyConnectedHeaders(
        community,
        request.headers
      );

      if (!verifiedAccount) {
        throw new Error("Invalid signature");
      }

      await verifyPosAuth(order.place_id, verifiedAccount);
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    const { error } = await deleteOrder(client, parseInt(orderId));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: `Order ${orderId} deleted successfully` },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in Delete Order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
