import { getServiceRoleClient } from "@/db";
import { attachTxHashToOrder, completeOrder, getOrder } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";
import {
  BundlerService,
  CommunityConfig,
  getAccountAddress,
} from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { Wallet } from "ethers";
import { WiseTransaction } from "@/wise";
import { getPlaceByUsername } from "@/db/places";

export async function POST(request: Request) {
  console.log("Received request");

  let bearerToken = request.headers.get("Authorization");
  if (!bearerToken) {
    return NextResponse.json({ error: "No authorization" }, { status: 400 });
  }

  console.log("Parsing bearer token");

  bearerToken = bearerToken.split(" ")[1];
  if (!bearerToken) {
    return NextResponse.json({ error: "No authorization" }, { status: 400 });
  }

  console.log("checking if bearer token is valid");

  if (bearerToken !== process.env.TOP_UP_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Invalid authorization" },
      { status: 400 }
    );
  }

  console.log("bearer token is valid");

  const body: WiseTransaction = await request.json();

  // Log the metadata
  console.log("Wise Transaction. Metadata:", body);

  const prefix = `+++${process.env.NEXT_PUBLIC_BANK_ACCOUNT_REFERENCE_PREFIX}`;

  let reference = body.details.paymentReference;
  if (!reference?.startsWith(prefix)) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  console.log("reference is valid");

  reference = reference.replace(/\+\+\+/g, "");
  const [network, slug, strOrderId] = reference.split("/");
  if (network !== process.env.NEXT_PUBLIC_BANK_ACCOUNT_REFERENCE_PREFIX) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  console.log("network is valid");

  const orderId = parseInt(strOrderId);

  if (!slug || !strOrderId || isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  console.log("orderId is valid");

  const client = getServiceRoleClient();
  const { error } = await completeOrder(client, orderId);

  console.log("order completed");

  const { data: place, error: placeError } = await getPlaceByUsername(
    client,
    slug
  );
  if (placeError || !place) {
    return NextResponse.json({ error: placeError?.message }, { status: 400 });
  }

  const account = place.accounts[0];
  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const { data: order, error: orderError } = await getOrder(client, orderId);
  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message }, { status: 400 });
  }

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

  const intAmount = order.total;

  const description = `Received ${
    community.primaryToken.symbol
  } ${formatCurrencyNumber(intAmount)} from ${place.name}`;

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

  return NextResponse.json({ received: true });
}
