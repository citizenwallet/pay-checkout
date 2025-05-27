import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getOrder } from "@/db/orders";
import { getProcessorTx } from "@/db/ordersProcessorTx";
import { createStripeRefund } from "@/services/stripe";
import { createVivaRefund } from "@/services/viva";
import { CommunityConfig, verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { verifyPosAuth } from "../../../auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const client = getServiceRoleClient();

    const { data: orderData, error: orderError } = await getOrder(
      client,
      Number(orderId)
    );

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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

      await verifyPosAuth(orderData.place_id, verifiedAccount);
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(orderId)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (orderError) {
      throw new Error("Order not found");
    }

    const { data: processorTx, error: processorTxError } = await getProcessorTx(
      client,
      orderData.processor_tx!
    );
    if (!processorTx || processorTxError) {
      throw new Error("Order has no processor tx");
    }

    if (orderData.type === "app" && orderData.status === "paid") {
      // TODO: Implement refund for app orders
    } else if (
      orderData.type !== "app" &&
      orderData.status === "paid" &&
      !!processorTx
    ) {
      switch (processorTx.type) {
        case "stripe": {
          const refunded = await createStripeRefund(
            processorTx.processor_tx_id
          );
          if (!refunded) {
            throw new Error("Unable to refund this order");
          }
          return;
        }
        case "viva": {
          const refunded = await createVivaRefund(
            processorTx.processor_tx_id,
            orderData.total
          );
          if (!refunded) {
            throw new Error("Unable to refund this order");
          }
          return;
        }
        default:
          throw new Error("Unable to refund this order");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error in generate-order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function isValidRequestData(orderId: string): boolean {
  return typeof orderId === "string";
}
