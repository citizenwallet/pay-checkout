"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order } from "@/db/orders";
import { differenceInMinutes, format } from "date-fns";
import { Profile } from "@citizenwallet/sdk";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";
import { Item } from "@/db/items";
import Image from "next/image";
import { getOrderByPlaceAction } from "@/app/actions/getOrderByPlace";
import { Loader2 } from "lucide-react";

interface VendorOrdersProps {
  initialOrders?: Order[];
  items?: { [key: number]: Item };
  placeId?: number;
  profile?: Profile | null;
  currencyLogo?: string;
  loading?: boolean;
}

export default function VendorOrders({
  initialOrders = [],
  items = {},
  placeId,
  profile,
  currencyLogo,
  loading = false,
}: VendorOrdersProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    if (!placeId) return;

    const interval = setInterval(() => {
      getOrderByPlaceAction(placeId, 10, 0).then(({ data }) => {
        if (!data) return;

        // TODO: Add pagination
        setOrders(data);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [placeId]);

  const getOrderStatus = (order: Order) => {
    if (order.status === "paid") return "paid";
    if (order.status === "cancelled") return "cancelled";
    if (differenceInMinutes(new Date(), new Date(order.created_at)) > 15)
      return "cancelled";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500 hover:bg-green-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-yellow-500 hover:bg-yellow-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow max-w-md mx-auto w-full bg-white shadow-xl">
        <header className="p-4 bg-primary text-primary-foreground sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {loading && (
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
            )}
            {!loading && (
              <Image
                src={profile?.image ?? "/shop.png"}
                alt={profile?.name ?? "Shop"}
                width={80}
                height={80}
                className="rounded-full h-16 w-16 object-cover"
              />
            )}
            {loading && (
              <div>
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-md" />
                <div className="h-5 w-48 bg-gray-200 animate-pulse rounded-md" />
              </div>
            )}
            {!loading && (
              <div>
                <h1 className="text-2xl font-bold">
                  {profile?.name ?? "Shop"}
                </h1>
                <p className="text-sm opacity-90">
                  {profile?.description ?? ""}
                </p>
              </div>
            )}
          </div>
        </header>

        <div className="p-4">
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {loading &&
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[200px] w-full bg-gray-200 animate-pulse rounded-md mb-4"
                />
              ))}
            {!loading &&
              orders.map((order) => {
                const status = getOrderStatus(order);
                return (
                  <Card key={order.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Order #{order.id}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                          {status === "pending" && (
                            <Loader2 className="animate-spin h-4 w-4" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(
                            new Date(order.created_at),
                            "MMM d, yyyy HH:mm"
                          )}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1">
                          Total: <CurrencyLogo logo={currencyLogo} size={18} />
                          {formatCurrencyNumber(order.total)}
                        </p>
                        {order.items.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Items:</p>
                            {order.items.map((orderItem) => {
                              const item = items[orderItem.id];
                              if (!item) return null;
                              return (
                                <div
                                  key={orderItem.id}
                                  className="flex justify-between text-sm pl-2"
                                >
                                  <span>
                                    {item?.name} × {orderItem.quantity}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CurrencyLogo
                                      logo={currencyLogo}
                                      size={14}
                                    />
                                    {formatCurrencyNumber(
                                      item?.price * orderItem.quantity
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
