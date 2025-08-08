import { getServiceRoleClient } from "@/db";
import {
  BundlerService,
  callOnCardCallData,
  CommunityConfig,
  getAccountAddress,
  getCardAddress,
  tokenTransferCallData,
  tokenTransferEventTopic,
  UserOpData,
  UserOpExtraData,
  verifyConnectedHeaders,
} from "@citizenwallet/sdk";
import { NextResponse } from "next/server";
import Config from "@/cw/community.json";
import { completeAppOrder, getOrderWithBusiness } from "@/db/orders";
import { id, parseUnits, Wallet } from "ethers";
import { getPlaceById } from "@/db/places";
import { getCardBySerial } from "@/db/cards";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ serial: string; orderId: string }> }
) {
  const { serial, orderId } = await params;

  const client = getServiceRoleClient();

  const community = new CommunityConfig(Config);

  let account: string | null = null;
  try {
    const verifiedAccount = await verifyConnectedHeaders(
      community,
      request.headers
    );

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }

    account = verifiedAccount;
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  if (!account) {
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  try {
    const { data: card, error: cardError } = await getCardBySerial(
      client,
      serial
    );
    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (card.owner === null) {
      return NextResponse.json({ error: "Card not claimed" }, { status: 400 });
    }

    if (card.owner.toLowerCase() !== account.toLowerCase()) {
      return NextResponse.json({ error: "Not card owner" }, { status: 401 });
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

    const { data: place, error: placeError } = await getPlaceById(
      client,
      order.place_id
    );
    if (placeError) {
      return NextResponse.json({ error: placeError.message }, { status: 500 });
    }

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order is not pending" },
        { status: 400 }
      );
    }

    const privateKey = process.env.CARD_MANAGER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Private key is not set");
    }

    const signer = new Wallet(privateKey);

    const signerAccountAddress = await getAccountAddress(
      community,
      signer.address
    );
    if (!signerAccountAddress) {
      throw new Error("Could not find an account for you!");
    }

    const bundler = new BundlerService(community);

    const token = community.getToken(order.token ?? undefined);

    const formattedAmount = parseUnits(
      (order.total / 100).toFixed(2),
      token.decimals
    );

    const destinationAddress = place.accounts[0];

    const transferCalldata = tokenTransferCallData(
      destinationAddress,
      formattedAmount
    );

    const senderHashedUserId = id(serial);

    const senderAddress = await getCardAddress(community, senderHashedUserId);
    if (!senderAddress) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const calldata = callOnCardCallData(
      community,
      senderHashedUserId,
      token.address,
      BigInt(0),
      transferCalldata
    );

    const cardConfig = community.primarySafeCardConfig;

    const userOpData: UserOpData = {
      topic: tokenTransferEventTopic,
      from: senderAddress,
      to: destinationAddress,
      value: formattedAmount.toString(),
    };

    let extraData: UserOpExtraData | undefined;
    if (order.description) {
      extraData = {
        description: order.description,
      };
    }

    const hash = await bundler.call(
      signer,
      cardConfig.address,
      signerAccountAddress,
      calldata,
      BigInt(0),
      userOpData,
      extraData
    );
    if (!hash) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const { data: orderData, error: orderCreationError } =
      await completeAppOrder(client, parseInt(orderId), senderAddress, hash);

    if (orderCreationError) {
      return NextResponse.json(
        { error: orderCreationError.message },
        { status: 500 }
      );
    }

    console.log("orderData", orderData);

    return NextResponse.json(orderData, { status: 200 });
  } catch (error) {
    console.error("pos order creation error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
