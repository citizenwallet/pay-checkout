import { getClientSecretAction } from "@/app/actions/paymentProcess";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { cn } from "@/lib/utils";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function PayElement({
  total,
  accountOrUsername,
  orderId,
  closeUrl,
  successUrl,
  errorUrl,
  showMethods,
}: {
  total: number;
  accountOrUsername: string;
  orderId: number;
  closeUrl?: string;
  successUrl?: string;
  errorUrl?: string;
  showMethods: boolean;
}) {
  const [elementStatus, setElementStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");
  const [message, setMessage] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const router = useRouter();

  // Fetch client secret on component mount
  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const secret = await getClientSecretAction(
          accountOrUsername,
          orderId,
          total
        );
        setClientSecret(secret);
      } catch (error: unknown) {
        console.error("Error fetching client secret:", error);
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("An unknown error occurred.");
        }
      }
    };

    if (!clientSecret) {
      fetchClientSecret();
    }
  }, [accountOrUsername, orderId, total, clientSecret]);

  // Show loading state while fetching client secret
  if (!clientSecret) {
    return (
      <div className="mb-2">
        <Skeleton className="w-full h-12" />
      </div>
    );
  }

  return (
    <div
      id="checkout-page"
      className={cn(
        "mb-2",
        elementStatus === "loading"
          ? "min-h-12"
          : elementStatus === "ready"
          ? "min-h-12"
          : "h-0 overflow-hidden",
        showMethods ? "opacity-100" : "opacity-0"
      )}
    >
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
          },
          loader: "always",
        }}
      >
        <CheckoutForm
          accountOrUsername={accountOrUsername}
          orderId={orderId}
          closeUrl={closeUrl}
          successUrl={successUrl}
          errorUrl={errorUrl}
          setMessage={setMessage}
          router={router}
          setElementStatus={setElementStatus}
        />
      </Elements>
      {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
    </div>
  );
}

function CheckoutForm({
  accountOrUsername,
  orderId,
  closeUrl,
  successUrl,
  errorUrl,
  setMessage,
  router,
  setElementStatus,
}: {
  accountOrUsername: string;
  orderId: number;
  closeUrl?: string;
  successUrl?: string;
  errorUrl?: string;
  setMessage: (message: string) => void;
  router: AppRouterInstance;
  setElementStatus: (status: "loading" | "ready" | "unavailable") => void;
}) {
  const elements = useElements();
  const stripe = useStripe();

  const handleExpressCheckoutConfirm = async () => {
    if (!stripe || !elements) {
      setMessage("Stripe has not been initialized.");
      return;
    }

    try {
      // Submit the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message || "An unknown error occurred.");
        return;
      }

      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url:
            successUrl ||
            closeUrl ||
            `${window.location.origin}/${accountOrUsername}/pay/${orderId}/success`,
        },
      });

      if (error) {
        setMessage(error.message || "An unknown error occurred.");
      } else {
        setMessage("Payment Successful!");
        router.push(
          successUrl ||
            closeUrl ||
            `/${accountOrUsername}/pay/${orderId}/success`
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      setMessage("An unexpected error occurred during payment.");

      if (errorUrl) {
        router.push(errorUrl);
        return;
      }
    }
  };

  const handleExpressCheckoutReady = () => {
    setTimeout(() => {
      // check if there are buttons inside the element
      const element = document.getElementById("express-checkout-element");

      // get height of element
      const height = element?.clientHeight ?? 0;

      setElementStatus(height >= 50 ? "ready" : "unavailable");
    }, 1000);
  };

  return (
    <ExpressCheckoutElement
      id="express-checkout-element"
      options={{
        buttonHeight: 50,
      }}
      onConfirm={handleExpressCheckoutConfirm}
      onReady={handleExpressCheckoutReady}
    />
  );
}
