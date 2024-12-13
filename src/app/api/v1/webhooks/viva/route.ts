import { getServiceRoleClient } from "@/db";
import { attachTxHashToOrder, createTerminalOrder } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";
import {
  BundlerService,
  CommunityConfig,
  getAccountAddress,
} from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { Wallet } from "ethers";
import { getPlaceByTerminalId } from "@/db/places";
import { VivaTransactionWebhookBody } from "@/viva";

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

  const body: VivaTransactionWebhookBody = await request.json();

  console.log("Viva webhook body", body);

  const { TerminalId, TransactionId, Amount = 0 } = body.EventData;

  console.log("Amount", Amount);

  const amount = Amount * 100;

  console.log("amount", amount);

  const client = getServiceRoleClient();
  const { data: place, error: placeError } = await getPlaceByTerminalId(
    client,
    TerminalId
  );

  if (placeError || !place) {
    console.error("Error getting place by terminal id", placeError);
    return NextResponse.json({ received: true });
  }

  const { data: order, error: orderError } = await createTerminalOrder(
    client,
    place.id,
    amount,
    `Order: ${TransactionId}`
  );

  if (orderError || !order) {
    console.error("Error creating terminal order", orderError);
    return NextResponse.json({ received: true });
  }

  if (
    !process.env.FAUCET_PRIVATE_KEY ||
    process.env.FAUCET_PRIVATE_KEY === "DEV"
  ) {
    console.error("No faucet private key");
    return NextResponse.json({ received: true });
  }

  const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY!);

  const community = new CommunityConfig(Config);

  const intAmount = amount;

  const description = `Received ${
    community.primaryToken.symbol
  } ${formatCurrencyNumber(intAmount)} from ${place.name}`;

  const senderAccount = await getAccountAddress(community, signer.address);
  if (!senderAccount) {
    console.error("Error getting sender account", senderAccount);
    return NextResponse.json({ received: true });
  }

  const account = place.accounts[0];
  if (!account) {
    console.error("Error getting account", account);
    return NextResponse.json({ received: true });
  }

  const bundler = new BundlerService(community);

  const txHash = await bundler.mintERC20Token(
    signer,
    community.primaryToken.address,
    senderAccount,
    account,
    `${intAmount / 100}`,
    description
  );

  await attachTxHashToOrder(client, order.id, txHash);

  return NextResponse.json({ received: true });
}
