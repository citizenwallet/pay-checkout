"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useRef } from "react";

export default function ElementsWrapper({
  publishableKey,
  children,
}: Readonly<{
  publishableKey: string;
  children: React.ReactNode;
}>) {
  const stripePromiseRef = useRef<Promise<Stripe | null>>(
    loadStripe(publishableKey)
  );
  return <Elements stripe={stripePromiseRef.current}>{children}</Elements>;
}
