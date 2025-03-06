import { getServiceRoleClient } from "@/db";
import { getPlaceId } from "@/lib/place";
import { NextResponse } from "next/server";
import { getOrdersByPlace } from "@/db/orders";

export async function GET(
  request: Request,
  context: { params: Promise<{ accountOrUsername: string }> }
) {
  const { accountOrUsername } = await context.params;
  if (!accountOrUsername) {
    return NextResponse.json(
      { error: "No accountOrUsername" },
      { status: 400 }
    );
  }

  const client = getServiceRoleClient();

  const placeId = await getPlaceId(client, accountOrUsername);
  if (!placeId) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  const { data } = await getOrdersByPlace(client, placeId, 20);

  return NextResponse.json({ orders: data });
}
