import { getServiceRoleClient } from "@/db";
import { NextResponse } from "next/server";
import { getOrderStatus } from "@/db/orders";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");
  
    if (!orderIdParam) {
      return NextResponse.json({ error: "No orderId provided" }, { status: 400 });
    }
  
    const parsedOrderId = parseInt(orderIdParam);
    if (isNaN(parsedOrderId)) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }
  
    const client = getServiceRoleClient();
  
    const { data: order, error } = await getOrderStatus(client, parsedOrderId);
  
    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  
    return NextResponse.json({ status: order });
  }
