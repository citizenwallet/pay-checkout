import { Item } from "@/db/items";
import { Order } from "@/db/orders";
import { Place } from "@/db/places";
import { summarizeItemsForDescription } from "@/lib/items";
import { format } from "date-fns";

export const sendOrderConfirmationEmail = async (
  email: string,
  name: string,
  order: Order,
  items: Item[],
  place: Place
) => {
  let description = order.description || "";
  if (items.length) {
    description = summarizeItemsForDescription(items, order);
  }

  const params = {
    ORDER_ID: order.id,
    ORDER_PLACE: place.name,
    ORDER_PLACE_IMAGE:
      place.image ?? `https://${process.env.BASE_DOMAIN}/shop.png`,
    ORDER_DESCRIPTION: description,
    ORDER_DATE: format(order.created_at, "dd/MM/yyyy HH:mm"),
    ORDER_AMOUNT: (order.total / 100).toFixed(2),
    ORDER_LINK: `https://${process.env.BASE_DOMAIN}/${place.slug}/pay/${order.id}/success`,
  };

  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    },
    templateId: 1,
    subject: `${place.name} - Order #${order.id} Confirmed`,
    params,
    messageVersions: [
      {
        to: [{ email, name }],
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log(response);

  if (!response.ok) {
    throw new Error("Failed to send order confirmation email");
  }
};
