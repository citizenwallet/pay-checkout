import { NextResponse } from "next/server";
import {
  VIVA_EVENT_TYPES,
  VivaEvent,
  VivaTransactionPaymentCreated,
  VivaTransactionPriceCalculated,
} from "@/viva";
import { transactionPaymentCreated } from "./transactionPaymentCreated";
import { transactionPriceCalculated } from "./transactionPriceCalculated";

function isAllowedIP(ip: string): boolean {
  const allowedIPs = [
    "51.138.37.238",
    "13.80.70.181",
    "13.80.71.223",
    "13.79.28.70",
    "4.223.76.50",
    "20.54.89.16",
    // CIDR ranges
    "40.127.253.112/28",
    "51.105.129.192/28",
    "51.12.157.0/28",
  ];

  return allowedIPs.some((allowedIP) => {
    if (allowedIP.includes("/")) {
      // Handle CIDR notation
      const [network, bits] = allowedIP.split("/");
      const mask = ~((1 << (32 - parseInt(bits))) - 1);
      const ipNum = ip
        .split(".")
        .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
      const networkNum = network
        .split(".")
        .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
      return (ipNum & mask) === (networkNum & mask);
    }
    // Direct IP comparison
    return ip === allowedIP;
  });
}

export async function GET() {
  const basicAuth = Buffer.from(
    `${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_API_KEY}`
  ).toString("base64");

  const response = await fetch(
    `https://www.vivapayments.com/api/messages/config/token`,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  const data = await response.json();

  const verificationKey = data["Key"];
  if (!verificationKey) {
    return NextResponse.json({ error: "No verification key" }, { status: 500 });
  }

  return NextResponse.json({
    Key: verificationKey,
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    // Check if request is coming from Vercel
    const isVercelRequest = request.headers.get("x-vercel-proxy-signature");
    if (!isVercelRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get IP from Vercel's trusted header
    const ip = request.headers.get("x-real-ip");

    if (!ip || !isAllowedIP(ip)) {
      console.error("Unauthorized IP address:", ip);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const body: VivaEvent<unknown> = await request.json();

  console.log("Viva webhook body", body);

  switch (body.EventTypeId) {
    case VIVA_EVENT_TYPES.TRANSACTION_PAYMENT_CREATED:
      await transactionPaymentCreated(
        body.EventData as VivaTransactionPaymentCreated
      );
      break;
    case VIVA_EVENT_TYPES.TRANSACTION_PRICE_CALCULATED:
      await transactionPriceCalculated(
        body.EventData as VivaTransactionPriceCalculated
      );
      break;
  }

  return NextResponse.json({ received: true });
}
