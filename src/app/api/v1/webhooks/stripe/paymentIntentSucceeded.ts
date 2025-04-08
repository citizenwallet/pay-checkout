import { getOrder } from "@/db/orders";

import { getServiceRoleClient } from "@/db";
import { completeOrder } from "@/db/orders";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getItemsForPlace } from "@/db/items";
import { sendOrderConfirmationEmail } from "@/brevo";
import { getPlaceById } from "@/db/places";

export const paymentIntentSucceeded = async (event: Stripe.Event) => {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Log the metadata
  console.log("Payment Intent Succeeded. Metadata:", paymentIntent.metadata);

  const amount = paymentIntent.metadata?.amount;
  if (!amount) {
    return NextResponse.json({ error: "No amount" }, { status: 400 });
  }

  const account = paymentIntent.metadata?.account;
  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 400 });
  }

  const placeName = paymentIntent.metadata?.placeName;
  if (!placeName) {
    return NextResponse.json({ error: "No placeName" }, { status: 400 });
  }

  const placeId = paymentIntent.metadata?.placeId;
  if (!placeId) {
    return NextResponse.json({ error: "No placeId" }, { status: 400 });
  }

  const orderId = parseInt(paymentIntent.metadata?.orderId ?? "0");
  if (!orderId || isNaN(orderId)) {
    return NextResponse.json({ error: "No orderId" }, { status: 400 });
  }

  const client = getServiceRoleClient();
  const { error } = await completeOrder(client, orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const { data: order } = await getOrder(client, orderId);
    const { data: items } = await getItemsForPlace(client, parseInt(placeId));
    const { data: place } = await getPlaceById(client, parseInt(placeId));
    if (order && items && place) {
      const customerName = paymentIntent.metadata?.customerName;
      const customerEmail = paymentIntent.metadata?.customerEmail;

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
