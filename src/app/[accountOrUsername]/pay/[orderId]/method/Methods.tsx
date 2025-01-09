"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { CreditCard, ArrowLeft } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CurrencyLogo from "@/components/currency-logo";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Props {
  currencyLogo?: string;
  amount: number;
}

export default function CheckoutScreen({ currencyLogo, amount }: Props) {
  const router = useRouter();

  const handleBack = async () => {
    router.back();
  };

  return (
    <Elements stripe={stripePromise}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-start gap-4">
          <ArrowLeft onClick={handleBack} className="cursor-pointer mt-1.5" />

          <CardTitle className="text-2xl font-bold">Payment method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <CurrencyLogo logo={currencyLogo} size={32} />
              <span className="text-2xl font-semibold">
                {amount.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="h-14 items-center justify-center space-x-2"
            >
              <Image
                src="/methods/bancontact.svg"
                alt="Bancontact"
                width={180}
                height={32}
              />
            </Button>
            <Button
              variant="outline"
              className="h-14 items-center justify-center space-x-2"
            >
              <CreditCard className="h-8 w-8" />
              <span className="text-lg font-semibold">Card</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Elements>
  );
}
