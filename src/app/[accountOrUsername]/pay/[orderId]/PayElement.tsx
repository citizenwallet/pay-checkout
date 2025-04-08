import { getClientSecretAction } from "@/app/actions/paymentProcess";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
}: {
  total: number;
  accountOrUsername: string;
  orderId: number;
  closeUrl?: string;
}) {
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
    <div id="checkout-page" className="mb-2 min-h-12">
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
          setMessage={setMessage}
          router={router}
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
  setMessage,
  router,
}: {
  accountOrUsername: string;
  orderId: number;
  closeUrl?: string;
  setMessage: (message: string) => void;
  router: AppRouterInstance;
}) {
  const elements = useElements();
  const stripe = useStripe();

  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    console.log("event", event);

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
            closeUrl ||
            `${window.location.origin}/${accountOrUsername}/pay/${orderId}/success`,
        },
      });

      if (error) {
        setMessage(error.message || "An unknown error occurred.");
      } else {
        setMessage("Payment Successful!");
        router.push(closeUrl || `/${accountOrUsername}/pay/${orderId}/success`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setMessage("An unexpected error occurred during payment.");
    }
  };

  return (
    <ExpressCheckoutElement
      options={{
        buttonHeight: 50,
      }}
      onConfirm={handleExpressCheckoutConfirm}
    />
  );
}
