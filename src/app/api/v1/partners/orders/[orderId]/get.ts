import { getServiceRoleClient } from "@/db";
import { getOrder } from "@/db/orders";
import { checkApiKey } from "@/db/apiKeys";
import { createCorsResponse, createCorsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return createCorsOptionsResponse();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const headersList = request.headers;
  const apiKey = headersList.get("x-api-key");

  if (!apiKey) {
    return createCorsResponse({ error: "No API key specified" }, 400);
  }

  const client = getServiceRoleClient();

  const ok = await checkApiKey(client, apiKey, ["orders"]);
  if (!ok) {
    return createCorsResponse({ error: "Invalid API key" }, 401);
  }

  const { orderId } = await params;

  if (!orderId) {
    return createCorsResponse({ error: "No orderId provided" }, 400);
  }

  const parsedOrderId = parseInt(orderId);
  if (isNaN(parsedOrderId)) {
    return createCorsResponse({ error: "Invalid orderId" }, 400);
  }

  const { data: order, error } = await getOrder(client, parsedOrderId);

  if (error) {
    return createCorsResponse({ error: "Database error" }, 500);
  }

  if (!order) {
    return createCorsResponse({ error: "Order not found" }, 404);
  }

  return createCorsResponse(order, 200);
}
