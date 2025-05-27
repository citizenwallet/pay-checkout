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
import { getPosById } from "@/db/pos";
import { completePosOrder, getOrder } from "@/db/orders";
import { id, parseUnits, Wallet } from "ethers";
import { getPlaceById } from "@/db/places";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ serial: string; orderId: string }> }
) {
  const { serial, orderId } = await params;

  const client = getServiceRoleClient();

  const community = new CommunityConfig(Config);

  let posId: string | null = null;
  try {
    const verifiedAccount = await verifyConnectedHeaders(
      community,
      request.headers
    );

    if (!verifiedAccount) {
      throw new Error("Invalid signature");
    }

    posId = verifiedAccount;
  } catch (error) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  if (!posId) {
    return NextResponse.json(
      { error: "Account verification failed" },
      { status: 401 }
    );
  }

  try {
    const { data: pos, error: posError } = await getPosById(client, posId);
    if (posError) {
      console.error("Error fetching pos:", posError);
      return NextResponse.json(
        { error: "Error fetching pos" },
        { status: 500 }
      );
    }

    if (!pos) {
      return NextResponse.json({ error: "Pos not found" }, { status: 404 });
    }

    if (!pos.is_active) {
      return NextResponse.json({ error: "Pos is not active" }, { status: 403 });
    }

    const placeId = pos.place_id;

    const { data: place, error: placeError } = await getPlaceById(
      client,
      placeId
    );
    if (placeError) {
      return NextResponse.json({ error: placeError.message }, { status: 500 });
    }

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const { data: order, error: orderError } = await getOrder(
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
        { error: "Order is not pending" },
        { status: 400 }
      );
    }

    if (order.pos !== null && order.pos.toLowerCase() !== posId.toLowerCase()) {
      return NextResponse.json(
        { error: "Order created for a different pos" },
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

    const token = community.primaryToken;

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
      await completePosOrder(client, parseInt(orderId), hash);

    if (orderCreationError) {
      return NextResponse.json(
        { error: orderCreationError.message },
        { status: 500 }
      );
    }

    console.log("orderData", orderData);

    return NextResponse.json({ orderId: orderData.id }, { status: 200 });
  } catch (error) {
    console.error("pos order creation error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
