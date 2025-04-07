"use client";

import { cancelOrderAction } from "@/app/actions/cancelOrder";
import CurrencyLogo from "@/components/currency-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Item } from "@/db/items";
import { Order } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";
import {
  ArrowLeft,
  BuildingIcon,
  CreditCard,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PayElement from "./PayElement";
import { useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { getClientSecretAction } from "@/app/actions/paymentProcess";
import { Separator } from "@/components/ui/separator";

interface Props {
  accountOrUsername: string;
  order?: Order;
  items?: { [key: number]: Item };
  currencyLogo?: string;
  tx?: string;
  customOrderId?: string;
}

export default function Component({
  accountOrUsername,
  order,
  items,
  currencyLogo,
  customOrderId,
}: Props) {
  const stripe = useStripe();
  const router = useRouter();

  const [cancelled, setCancelled] = useState(false);

  const [cartItems, setCartItems] = useState<Order["items"]>(
    order?.items ?? []
  );

  const updateQuantity = (id: number, change: number) => {
    setCartItems(
      cartItems
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = !items
    ? 0
    : order?.items.length === 0
    ? order?.total ?? 0
    : cartItems.reduce((sum, cartItem) => {
        const item = items[cartItem.id];
        if (!item) return sum;
        return sum + item.price * cartItem.quantity;
      }, 0);

  const vatPercent = 0.21; // TODO: make this configurable

  const vat = !items
    ? 0
    : order?.items.length === 0
    ? (order?.total ?? 0) * vatPercent
    : cartItems.reduce((sum, cartItem) => {
        const item = items[cartItem.id];
        if (!item) return sum;
        // Calculate VAT portion from the inclusive price
        // For example, with 20% VAT: price of 120 contains 20 VAT
        const vatMultiplier = item.vat / (100 + item.vat);
        const itemVat = item.price * vatMultiplier * cartItem.quantity;
        return sum + itemVat;
      }, 0);

  const totalExcludingVat = total - vat;

  const handleCancelOrder = async () => {
    if (!order) {
      return;
    }

    await cancelOrderAction(order.id);
    setCancelled(true);

    if (!customOrderId) {
      router.back();
    }
  };

  const handleBancontact = async () => {
    if (!stripe) return;

    if (!order) return;

    try {
      const clientSecret = await getClientSecretAction(
        accountOrUsername,
        order.id,
        total
      );

      if (!clientSecret) {
        throw new Error("No client secret");
      }

      const { error, paymentIntent } = await stripe.confirmBancontactPayment(
        clientSecret,
        {
          payment_method: {
            billing_details: {
              name: "Anonymous",
            },
          },
          return_url: `${window.location.origin}/${accountOrUsername}/pay/${order.id}/success`,
        }
      );

      if (error) {
        throw new Error(error.message);
      } else if (paymentIntent?.status === "succeeded") {
        router.push(`/${accountOrUsername}/pay/${order.id}/success`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBack = async () => {
    if (order) {
      await handleCancelOrder();
    }

    router.back();
  };

  const noItems = order?.items.length === 0;

  if (cancelled) {
    return <div>Order cancelled</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="flex flex-row items-center justify-start gap-4">
          {!customOrderId && (
            <ArrowLeft onClick={handleBack} className="cursor-pointer mt-1.5" />
          )}
          <CardTitle className="text-2xl font-bold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-200">
            {order?.description && (
              <li className="p-4 bg-gray-50 rounded-md">
                <p className="text-gray-600">{order.description}</p>
              </li>
            )}
            {cartItems.map((cartItem) => {
              const item = items?.[cartItem.id];
              if (!item) return null;
              return (
                <li
                  key={item.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{item.name}</h3>
                    <p className="text-gray-500 flex items-center gap-1">
                      <CurrencyLogo logo={currencyLogo} size={16} />
                      {formatCurrencyNumber(item.price)} each
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-2 w-8 text-center">
                      {cartItem.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateQuantity(item.id, -cartItem.quantity)
                      }
                      className="ml-2 h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {!noItems && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-normal">
                Total (excluding VAT):
              </span>
              <span className="text-lg font-normal flex items-center gap-1">
                <CurrencyLogo logo={currencyLogo} size={16} />
                {formatCurrencyNumber(totalExcludingVat)}
              </span>
            </div>
          )}
          {!noItems && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-normal">VAT:</span>
              <span className="text-lg font-normal flex items-center gap-1">
                <CurrencyLogo logo={currencyLogo} size={16} />
                {formatCurrencyNumber(vat)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-lg font-semibold flex items-center gap-1">
              <CurrencyLogo logo={currencyLogo} size={16} />
              {formatCurrencyNumber(total)}
            </span>
          </div>
          <Separator className="my-4" />

          {/* <Button
            onClick={handleBancontact}
            className="flex items-center gap-2 w-full h-14 text-white"
          >
            <span className="font-medium text-lg">Pay with</span>
            <CurrencyLogo logo={currencyLogo} size={24} />
            <span className="font-medium text-lg">Brussels Pay</span>
          </Button>

          <Separator className="my-4" /> */}

          <Button
            onClick={handleBancontact}
            className="flex items-center gap-2 w-full h-14 mb-2 bg-slate-900 hover:bg-slate-700 text-white "
          >
            <BuildingIcon className="w-5 h-5" />
            <span className="font-medium text-lg">Bancontact</span>
          </Button>

          <PayElement
            total={total}
            accountOrUsername={accountOrUsername}
            orderId={order?.id ?? 0}
          />

          <Button
            onClick={() =>
              router.push(`/${accountOrUsername}/pay/${order?.id}/credit-card`)
            }
            className="flex items-center gap-2 w-full h-14 bg-slate-900 hover:bg-slate-700 text-white"
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium text-lg">Credit Card</span>
          </Button>

          <Separator className="my-4" />

          <Button
            variant="outline"
            onClick={handleCancelOrder}
            className="w-full h-14 text-lg mb-4"
          >
            Cancel Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
