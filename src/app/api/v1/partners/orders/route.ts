import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { createPartnerOrder } from "@/db/orders";
import { checkApiKey } from "@/db/apiKeys";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { createCorsResponse, createCorsOptionsResponse } from "@/lib/cors";

interface PartnerOrderRequest {
  placeId: number;
  total: number;
  items?: { id: number; quantity: number }[];
  description?: string;
}

export async function OPTIONS() {
  return createCorsOptionsResponse();
}

export async function POST(request: NextRequest) {
  const headersList = request.headers;
  const apiKey = headersList.get("x-api-key");

  if (!apiKey) {
    return createCorsResponse({ error: "No API key specified" }, 400);
  }

  const client = getServiceRoleClient();

  const requestBody = (await request.json()) as PartnerOrderRequest;
  if (!requestBody.placeId) {
    return createCorsResponse({ error: "No placeId specified" }, 400);
  }

  if (!requestBody.total) {
    return createCorsResponse({ error: "No total specified" }, 400);
  }

  const { placeId, total, items = [], description = "" } = requestBody;

  const ok = await checkApiKey(client, apiKey, ["orders", placeId.toString()]);
  if (!ok) {
    return createCorsResponse({ error: "Invalid API key" }, 401);
  }

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
      return createCorsResponse({ error: error.message }, 500);
    }

    if (!order) {
      return createCorsResponse({ error: "Failed to create order" }, 500);
    }

    return createCorsResponse(
      {
        orderId: order.id,
        slug: order.place.slug,
        link: `https://${process.env.BASE_DOMAIN}/${order.place.slug}?orderId=${order.id}`,
      },
      200
    );
  } catch (error) {
    console.error(error);
    return createCorsResponse({ error: "Failed to fetch orders" }, 500);
  }
}
