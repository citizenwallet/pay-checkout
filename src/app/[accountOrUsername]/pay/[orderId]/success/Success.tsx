"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Order } from "@/db/orders";
import { Item } from "@/db/items";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";
import { useRouter } from "next/navigation";
import { getOrderStatus } from "@/app/actions/getOrderStatuts";
import { format } from "date-fns";

interface Props {
  accountOrUsername: string;
  order: Order;
  items: { [key: number]: Item };
  currencyLogo: string;
  tx?: string;
  close?: string;
}

export default function Component({
  accountOrUsername,
  order,
  items,
  currencyLogo,
  tx,
  close,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Order["status"]>(order.status);

  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const getStatus = async () => {
      const { data, error } = await getOrderStatus(order.id);
      if (error) {
        console.error(error);
      } else {
        setStatus(data?.status ?? "pending");
      }
    };

    intervalRef.current = setInterval(getStatus, 2000);

    return () => clearInterval(intervalRef.current);
  }, [order.id]);

  useEffect(() => {
    if (status === "paid") {
      clearInterval(intervalRef.current);

      if (close) {
        setTimeout(() => {
          router.push(close);
        }, 10000);
      }
    }
  }, [status]);

  const handleOrderAgain = () => {
    router.push(`/${accountOrUsername}`);
  };

  const handleClose = () => {
    if (close) {
      router.push(close);
    }
  };

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            {status === "paid" ? "Order Confirmed" : "Order Pending"}{" "}
            {status === "pending" && <Loader2 className="animate-spin" />}
          </CardTitle>
          {status === "paid" && (
            <div className="text-green-600 flex items-center justify-center mt-2">
              <Check className="w-6 h-6 mr-2" />
              <span>Thank you for your order!</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Order ID:</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Date:</span>
              <span>
                {order.completed_at
                  ? format(new Date(order.completed_at), "MMM d, yyyy HH:mm")
                  : ""}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="flex items-center gap-2 font-semibold">
                <CurrencyLogo logo={currencyLogo} size={20} />
                {formatCurrencyNumber(order.total)}
              </span>
            </div>
          </div>
          {order.description && (
            <div className="mt-6 flex justify-between items-center p-2 space-y-2 rounded-lg bg-gray-200">
              <span>{order.description}</span>
            </div>
          )}
          {order.items.length > 0 && (
            <div className="mt-6">
              <div className="mt-4 p-2 space-y-2 rounded-lg bg-gray-200">
                {order.items.map((item) => {
                  const itemData = items[item.id];
                  if (!itemData) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {itemData.name} x{item.quantity}
                      </span>
                      <span className="flex items-center gap-2">
                        <CurrencyLogo logo={currencyLogo} size={20} />
                        {formatCurrencyNumber(itemData.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Please show this to the vendor
          </p>
        </CardFooter>
      </Card>
      <div className="mt-4 flex justify-center">
        {!tx && <Button onClick={handleOrderAgain}>Order again</Button>}
        {tx && close && <Button onClick={handleClose}>Close</Button>}
      </div>
    </div>
  );
}
