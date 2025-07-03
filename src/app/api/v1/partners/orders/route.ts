import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { createPartnerOrder } from "@/db/orders";
import { checkApiKey } from "@/db/apiKeys";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

interface PartnerOrderRequest {
  placeId: number;
  total: number;
  items?: { id: number; quantity: number }[];
  description?: string;
}

export async function POST(request: NextRequest) {
  const headersList = request.headers;
  const apiKey = headersList.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key specified" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  const ok = await checkApiKey(client, apiKey, ["orders"]);
  if (!ok) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const requestBody = (await request.json()) as PartnerOrderRequest;
  if (!requestBody.placeId) {
    return NextResponse.json(
      { error: "No placeId specified" },
      { status: 400 }
    );
  }

  if (!requestBody.total) {
    return NextResponse.json({ error: "No total specified" }, { status: 400 });
  }

  const { placeId, total, items = [], description = "" } = requestBody;

  const community = new CommunityConfig(Config);
  const token = community.getToken();

  try {
    const { data: order, error } = await createPartnerOrder(
      client,
      placeId,
      total,
      items,
      description,
      token.address
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        orderId: order.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
