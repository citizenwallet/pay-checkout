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
import { useEffect, useState, useCallback } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { getClientSecretAction } from "@/app/actions/paymentProcess";
import { getOrderStatus } from "@/app/actions/getOrderStatuts";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import BrusselsPayButton from "./BrusselsPayButton";

interface Props {
  publishableKey: string;
  accountOrUsername: string;
  order?: Order;
  items?: { [key: number]: Item };
  currencyLogo?: string;
  tx?: string;
  customOrderId?: string;
  closeUrl?: string;
  tax: "yes" | "no";
  isTopUp?: boolean;
  successUrl?: string;
  errorUrl?: string;
}

export default function Component({
  publishableKey,
  accountOrUsername,
  order,
  items,
  currencyLogo,
  customOrderId,
  closeUrl,
  tax,
  isTopUp,
  successUrl: successUrlParam,
  errorUrl,
}: Props) {
  const successUrl: string | null =
    successUrlParam ||
    closeUrl ||
    `${
      typeof window !== "undefined" && window.location.origin
    }/${accountOrUsername}/pay/${order?.id}/success`;

  console.log("successUrl", successUrl);

  const stripe = useStripe();
  const router = useRouter();

  const [showMethods, setShowMethods] = useState<boolean>(false);
  const [cancelled, setCancelled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [cartItems, setCartItems] = useState<Order["items"]>(
    order?.items ?? []
  );

  useEffect(() => {
    setTimeout(() => {
      setShowMethods(true);
    }, 1000);
  }, []);

  const checkOrderStatus = useCallback(async () => {
    if (!order || checkingStatus) return;

    setCheckingStatus(true);
    try {
      const { data: statusData, error } = await getOrderStatus(order.id);

      if (error) {
        console.error("Error checking order status:", error);
        return;
      }

      const currentStatus = statusData?.status;

      console.log("currentStatus", currentStatus);

      // Handle different statuses
      if (currentStatus && currentStatus !== "pending") {
        switch (currentStatus) {
          case "paid":
            // Redirect to success page
            router.push(successUrl);
            break;
          case "cancelled":
            setCancelled(true);
            break;
          case "refunded":
          case "refund":
            // Handle refunded status - could redirect to error page or show message
            if (errorUrl) {
              router.push(errorUrl);
            } else {
              setCancelled(true);
            }
            break;
          case "needs_minting":
          case "needs_burning":
            // These are intermediate states, could show a processing message
            console.log(`Order is in ${currentStatus} state`);
            break;
          case "refund_pending":
            // Show that refund is pending
            console.log("Refund is pending");
            break;
          case "correction":
            // Handle correction status
            console.log("Order requires correction");
            break;
          default:
            console.log(`Unknown order status: ${currentStatus}`);
        }
      }
    } catch (error) {
      console.error("Error checking order status:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, [order, checkingStatus, router, successUrl, errorUrl]);

  // Handle page focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible and order is still pending, check status
        checkOrderStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [order?.id, order?.status, checkOrderStatus]);

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

    if (errorUrl) {
      router.push(errorUrl);
      return;
    }

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
          return_url: successUrlParam
            ? `${successUrlParam}?orderId=${order.id}`
            : successUrl,
        }
      );

      if (error) {
        throw new Error(error.message);
      } else if (paymentIntent?.status === "succeeded") {
        router.push(
          successUrlParam
            ? `${successUrlParam}?orderId=${order.id}`
            : successUrl
        );
      }
    } catch (error) {
      console.error(error);
      if (errorUrl) {
        router.push(errorUrl);
      }
    }
  };

  const handleCreditCard = async () => {
    if (!stripe) return;

    if (!order) return;

    let url = `/${accountOrUsername}/pay/${order?.id}/credit-card`;
    if (closeUrl) {
      url += `?close=${closeUrl}`;
    }

    if (successUrlParam) {
      if (url.includes("?")) {
        url += `&successUrl=${encodeURIComponent(successUrlParam)}`;
      } else {
        url += `?successUrl=${encodeURIComponent(successUrlParam)}`;
      }
    }

    if (errorUrl) {
      if (url.includes("?")) {
        url += `&errorUrl=${encodeURIComponent(errorUrl)}`;
      } else {
        url += `?errorUrl=${encodeURIComponent(errorUrl)}`;
      }
    }

    router.push(url);
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

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking order status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          {!noItems && tax === "yes" && (
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
          {!noItems && tax === "yes" && (
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
          {!isTopUp && <Separator className="my-4" />}

          <BrusselsPayButton
            order={order}
            accountOrUsername={accountOrUsername}
            currencyLogo={currencyLogo}
            isTopUp={isTopUp}
            successUrl={successUrl}
            errorUrl={errorUrl}
          />

          <Separator className="my-4" />

          <div className="flex justify-center items-center gap-2 my-4">
            <p className="text-lg">Traditional Payments</p>
          </div>

          <div
            className={cn(
              "flex flex-col gap-2 transition-all duration-300",
              showMethods ? "max-h-full" : "max-h-0 overflow-hidden"
            )}
          >
            <Button
              onClick={handleBancontact}
              className={cn(
                "flex items-center gap-2 w-full h-14 mb-2 bg-slate-900 hover:bg-slate-700 text-white transition-opacity duration-300",
                showMethods ? "opacity-100" : "opacity-0"
              )}
            >
              <BuildingIcon className="w-5 h-5" />
              <span className="font-medium text-lg">Bancontact</span>
            </Button>

            <PayElement
              publishableKey={publishableKey}
              total={total}
              accountOrUsername={accountOrUsername}
              orderId={order?.id ?? 0}
              closeUrl={closeUrl}
              successUrl={
                successUrlParam
                  ? `${successUrlParam}?orderId=${order?.id}`
                  : undefined
              }
              errorUrl={errorUrl}
              showMethods={showMethods}
            />

            <Button
              onClick={handleCreditCard}
              className={cn(
                "flex items-center gap-2 w-full h-14 bg-slate-900 hover:bg-slate-700 text-white transition-opacity duration-300",
                showMethods ? "opacity-100" : "opacity-0"
              )}
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium text-lg">Credit Card</span>
            </Button>
          </div>

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
