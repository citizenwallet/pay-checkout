import { getOrderWithBusiness } from "@/db/orders";

import { getServiceRoleClient } from "@/db";
import { completeOrder } from "@/db/orders";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getItemsForPlace } from "@/db/items";
import { sendOrderConfirmationEmail } from "@/brevo";
import { getPlaceById } from "@/db/places";

export const checkoutSessionCompleted = async (event: Stripe.Event) => {
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
  const { error } = await completeOrder(client, orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const { data: order } = await getOrderWithBusiness(client, orderId);
    const { data: items } = await getItemsForPlace(client, parseInt(placeId));
    const { data: place } = await getPlaceById(client, parseInt(placeId));
    if (order && items && place) {
      const customerName = session.customer_details?.name;
      const customerEmail = session.customer_details?.email;

      if (customerName && customerEmail) {
        await sendOrderConfirmationEmail(
          customerEmail,
          customerName,
          order,
          items,
          place
        );
      }
    }
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({ received: true });
};
