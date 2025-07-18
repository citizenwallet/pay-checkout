"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStripe,
  useElements,
  Elements,
  CardElement,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/app/actions/cancelOrder";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Order } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";

export default function CreditCard({
  publishableKey,
  clientSecret,
  order,
  accountOrUsername,
  currencyLogo,
  closeUrl,
  successUrl,
  errorUrl,
}: {
  publishableKey: string;
  clientSecret: string;
  order: Order;
  accountOrUsername: string;
  currencyLogo: string;
  closeUrl?: string;
  successUrl?: string;
  errorUrl?: string;
}) {
  const stripePromiseRef = useRef<Promise<Stripe | null>>(
    loadStripe(publishableKey)
  );
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!elements) return;

    let cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      cardElement = elements.create("card", {
        hidePostalCode: true,
        disableLink: true,
        style: {
          base: {
            fontSize: "16px",
            color: "#32325d",
            "::placeholder": {
              color: "#aab7c4",
            },
          },
          invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
          },
        },
      });
    }

    cardElement.mount("#card-element");
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);

    // Get the CardElement
    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      console.log("Card element is missing");
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (error) {
      setMessage(error.message || "Payment failed.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      setLoading(false);

      if (successUrl) {
        router.push(successUrl);
        return;
      }

      router.push(closeUrl || `/${accountOrUsername}/pay/${order.id}/success`);
      return;
    }

    console.log("Payment intent status:", paymentIntent?.status);
    setLoading(false);
  };

  const handleBack = async () => {
    router.back();
  };

  const handleCancelOrder = async () => {
    await cancelOrderAction(order.id);

    if (errorUrl) {
      router.push(errorUrl);
      return;
    }

    if (closeUrl) {
      router.push(closeUrl);
      return;
    }

    router.replace(`/${accountOrUsername}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="flex flex-row items-center justify-start gap-4">
          <ArrowLeft onClick={handleBack} className="cursor-pointer mt-1.5" />

          <CardTitle className="text-2xl font-bold">
            Enter Credit Card Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center gap-4">
          <Elements
            stripe={stripePromiseRef.current}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
              },
              loader: "auto",
            }}
          >
            <form id="payment-form" onSubmit={handleSubmit} className="w-full">
              <div
                id="card-element"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50 text-base"
              />
              <Button
                type="submit"
                className="w-full h-14 text-lg mb-4  text-white py-2 px-4 rounded transition-all disabled:bg-gray-400 mt-4"
                disabled={!stripe || !clientSecret}
              >
                Pay <CurrencyLogo logo={currencyLogo} size={20} />{" "}
                <b>{formatCurrencyNumber(order.total)}</b>
                {loading && <Loader2 className="ml-2 animate-spin" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelOrder}
                className="w-full h-14 text-lg mb-4"
              >
                Cancel Order
              </Button>
            </form>
          </Elements>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch">
          {message && (
            <p className="text-red-500 mt-4 text-center">{message}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
