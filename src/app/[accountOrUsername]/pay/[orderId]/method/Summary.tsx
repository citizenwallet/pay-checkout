"use client";

import { ArrowLeft, CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import CurrencyLogo from "@/components/currency-logo";
import { Order } from "@/db/orders";
import { formatCurrencyNumber } from "@/lib/currency";

interface Props {
  accountOrUsername: string;
  order?: Order;
  currencyLogo?: string;
}

export default function Component({
  accountOrUsername,
  order,
  currencyLogo,
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleCreditCard = () => {
    router.push(`/${accountOrUsername}/pay/${order?.id}/method/card`);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="flex flex-row items-center justify-start gap-4 mb-6">
          <ArrowLeft onClick={handleBack} className="cursor-pointer mt-1.5" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-row items-center justify-center gap-2">
            <CurrencyLogo size={60} logo={currencyLogo} />
            <p className="text-5xl font-bold">
              {formatCurrencyNumber(order?.total ?? 0)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 mb-4">
            <p className="text-lg font-bold">Brussels Pay</p>
            <p className="text-sm text-gray-500">Instant checkout</p>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 border-gray-800 text-lg border-2 font-bold"
            disabled={!order}
          >
            Bancontact
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-gray-800 text-lg border-2 font-bold"
            disabled={!order}
          >
            Apple Pay
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-gray-800 text-lg border-2 font-bold"
            disabled={!order}
          >
            Google Pay
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-gray-800 text-lg border-2 font-bold"
            disabled={!order}
            onClick={handleCreditCard}
          >
            <CreditCardIcon className="w-4 h-4 mr-2" />
            Credit Card
          </Button>
        </div>
      </div>
    </div>
  );
}
