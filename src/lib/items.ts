import { Item } from "@/db/items";
import { Order } from "@/db/orders";

export const summarizeItemsForDescription = (items: Item[], order: Order) => {
  const itemsWithQuantity = order.items
    .map((orderItem) => {
      const item = items.find((i) => i.id === orderItem.id);
      return item ? `${item.name} x ${orderItem.quantity}` : "";
    })
    .filter(Boolean);

  return itemsWithQuantity.join(", ");
};
