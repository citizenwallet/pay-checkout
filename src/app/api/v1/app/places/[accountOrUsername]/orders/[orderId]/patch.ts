import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { completeAppOrder } from "@/db/orders";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ accountOrUsername: string; orderId: string }> }
) {
  try {
    // Extract the accountOrUsername from the params object
    const { accountOrUsername, orderId } = await params;

    const body = await request.json();
    const { account, txHash } = body;

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

    if (!isValidRequestData(accountOrUsername, orderId, account, txHash)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const { data: orderData, error: orderError } = await completeAppOrder(
      client,
      Number(orderId),
      account,
      txHash
    );

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    return NextResponse.json(orderData, { status: 200 });
  } catch (err) {
    console.error("Error in generate-order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Validates the request data types and format
 */
function isValidRequestData(
  accountOrUsername: string,
  orderId: string,
  account: string | null,
  txHash: string
): boolean {
  return (
    typeof accountOrUsername === "string" &&
    typeof orderId === "string" &&
    (account === null || typeof account === "string") &&
    (txHash !== null || typeof txHash === "string")
  );
}
