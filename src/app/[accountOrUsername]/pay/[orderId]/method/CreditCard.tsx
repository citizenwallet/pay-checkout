"use client";

import { Button } from "@/components/ui/button";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function CreditCard() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) return; // Stripe.js not yet loaded.

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      console.error(error);
    } else {
      console.log(paymentMethod);
      // Send `paymentMethod.id` to your backend for further processing.
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" className="w-full mt-4" disabled={!stripe}>
        Pay
      </Button>
    </form>
  );
}
