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
import { createAppOrder } from "@/db/orders";
import { id, parseUnits, Wallet } from "ethers";
import { getPlaceById } from "@/db/places";
import { getCardBySerial } from "@/db/cards";
import { getItemsForPlace } from "@/db/items";

interface OrderRequest {
  placeId: number;
  items: { id: number; quantity: number }[];
  description: string;
  total: number;
  token?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params;
  const body = (await request.json()) as OrderRequest;
  const { placeId, items, description, total, token: tokenAddress } = body;

  const client = getServiceRoleClient();

  const community = new CommunityConfig(Config);

  const token = community.getToken(tokenAddress ?? undefined);

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

  if (!isValidRequestData(serial, body)) {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }

  if (!isValidItemsFormat(items)) {
    return NextResponse.json({ error: "Invalid item format" }, { status: 400 });
  }

  try {
    // validate card
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

    const cardAddress = await getCardAddress(community, id(serial));
    if (!cardAddress) {
      return NextResponse.json(
        { error: "Failed to get card address" },
        { status: 500 }
      );
    }

    // validate items
    const { data: availableItems, error } = await getItemsForPlace(
      client,
      placeId
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const availableItemIds = new Set(availableItems.map((item) => item.id));
    const invalidItem = items.find(
      (item: { id: number }) => !availableItemIds.has(item.id)
    );
    if (invalidItem) {
      return NextResponse.json(
        { error: "Invalid item ID: ${invalidItem.id}" },
        { status: 400 }
      );
    }

    const { data: place, error: placeError } = await getPlaceById(
      client,
      placeId
    );
    if (placeError) {
      return NextResponse.json({ error: placeError.message }, { status: 500 });
    }

    if (!place) {
      return NextResponse.json({ error: "Invalid place" }, { status: 400 });
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

    const formattedAmount = parseUnits(
      (total / 100).toFixed(2),
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
    if (description) {
      extraData = {
        description,
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

    const { data: order, error: orderError } = await createAppOrder(
      client,
      placeId,
      total,
      items,
      description,
      cardAddress,
      hash,
      token.address
    );
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    console.log("orderData", order);

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("pos order creation error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Validates the request data types and format
 */
function isValidRequestData(serial: string, body: OrderRequest): boolean {
  return (
    typeof serial === "string" &&
    Array.isArray(body.items) &&
    (body.description === null || typeof body.description === "string") &&
    typeof body.total === "number" &&
    (body.token === null || typeof body.token === "string")
  );
}

/**
 * Validates the format of items in the request
 */
function isValidItemsFormat(
  items: { id: number; quantity: number }[]
): boolean {
  return items.every(
    (item) =>
      typeof item === "object" &&
      typeof item.id === "number" &&
      typeof item.quantity === "number"
  );
}
