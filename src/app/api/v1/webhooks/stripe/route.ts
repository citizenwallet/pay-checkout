import { getServiceRoleClient } from "@/db";
import { attachTxHashToOrder, completeOrder } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";
import {
  BundlerService,
  CommunityConfig,
  getAccountAddress,
} from "@citizenwallet/sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import Config from "@/cw/community.json";
import { Wallet } from "ethers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Log the metadata
    console.log("Checkout Session Completed. Metadata:", session.metadata);

    const amount = session.metadata?.amount;
    if (!amount) {
      return NextResponse.json({ error: "No amount" }, { status: 400 });
    }

    const account = session.metadata?.account;
    if (!account) {
      return NextResponse.json({ error: "No account" }, { status: 400 });
    }

    const placeName = session.metadata?.placeName;
    if (!placeName) {
      return NextResponse.json({ error: "No placeName" }, { status: 400 });
    }

    const placeId = session.metadata?.placeId;
    if (!placeId) {
      return NextResponse.json({ error: "No placeId" }, { status: 400 });
    }

    const orderId = parseInt(session.metadata?.orderId ?? "0");
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "No orderId" }, { status: 400 });
    }

    const client = getServiceRoleClient();
    const { data, error } = await completeOrder(client, orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (
      !process.env.FAUCET_PRIVATE_KEY ||
      process.env.FAUCET_PRIVATE_KEY === "DEV"
    ) {
      return NextResponse.json({ received: true });
    }

    const signer = new Wallet(process.env.FAUCET_PRIVATE_KEY!);

    const community = new CommunityConfig(Config);

    const intAmount = parseInt(amount);

    const description = `Received ${
      community.primaryToken.symbol
    } ${formatCurrencyNumber(intAmount)} from ${placeName}`;

    const senderAccount = await getAccountAddress(community, signer.address);
    if (!senderAccount) {
      return NextResponse.json({ error: "No sender account" }, { status: 400 });
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

    await attachTxHashToOrder(client, orderId, txHash);

    console.log("Order paid", data);
  }

  return NextResponse.json({ received: true });
}
