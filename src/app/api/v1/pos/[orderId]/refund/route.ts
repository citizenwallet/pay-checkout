import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getOrder } from "@/db/orders";
import { getProcessorTx } from "@/db/ordersProcessorTx";
import { createStripeRefund } from "@/services/stripe";
import { createVivaRefund } from "@/services/viva";
import { CommunityConfig, verifyConnectedHeaders } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const body = await request.json();
    const { account } = body;

    const sigAuthAccount = request.headers.get("x-sigauth-account");
    const sigAuthExpiry = request.headers.get("x-sigauth-expiry");
    const sigAuthSignature = request.headers.get("x-sigauth-signature");

    try {
      if (!sigAuthAccount || !sigAuthExpiry || !sigAuthSignature) {
        return NextResponse.json(
          { error: "Missing signature headers" },
          { status: 401 }
        );
      }

      const expiryTime = new Date(sigAuthExpiry).getTime();
      const currentTime = new Date().getTime();

      if (currentTime > expiryTime) {
        return NextResponse.json(
          { error: "Signature expired" },
          { status: 401 }
        );
      }

      if (account && account.toLowerCase() !== sigAuthAccount.toLowerCase()) {
        return NextResponse.json(
          { error: "Account mismatch" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(orderId, account)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const { data: orderData, error: orderError } = await getOrder(
      client,
      Number(orderId)
    );

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
  } catch (err) {
    console.error("Error in generate-order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function isValidRequestData(orderId: string, account: string | null): boolean {
  return (
    typeof orderId === "string" &&
    (account === null || typeof account === "string")
  );
}
