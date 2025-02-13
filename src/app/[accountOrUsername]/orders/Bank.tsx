"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CurrencyLogo from "@/components/currency-logo";
import { Button } from "@/components/ui/button";
import { Check, Loader2, QrCode, X } from "lucide-react";
import { generateOrder } from "@/app/actions/generateOrder";
import { cancelOrderAction } from "@/app/actions/cancelOrder";
import { completeOrderAction } from "@/app/actions/completeOrder";
const MAX_WIDTH = 448;

interface BankProps {
  placeId?: number;
  placeSlug?: string;
  currencyLogo?: string;
}

export default function Bank({ placeId, placeSlug, currencyLogo }: BankProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [bankQR, setBankQR] = useState<string | null>(null);
  const [size, setSize] = useState(0);

  const orderIdRef = useRef<number | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTimeout(() => {
      const width = containerRef.current?.clientWidth ?? 150;
      setSize(width >= MAX_WIDTH ? MAX_WIDTH : width);
    }, 250);
  }, []);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9.,]/g, "");
    const value = sanitized.replace(",", ".");

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleClear = () => {
    orderIdRef.current = null;
    setBankQR(null);
    setLoading(false);
    setAmount("");
    setDescription("");
    if (amountRef.current) {
      amountRef.current.focus();
    }
  };

  const generateBankQR = async () => {
    if (!placeId || !placeSlug) {
      return;
    }

    setLoading(true);

    const parsedAmount = parseFloat(amount) * 100;
    const { data, error } = await generateOrder(
      placeId,
      {},
      description,
      parsedAmount,
      null
    );
    if (error || !data) {
      console.error(error);
      return;
    }

    orderIdRef.current = data;

    let qrCode = "BCD\n002\n1\nSCT";
    qrCode += `\n${process.env.NEXT_PUBLIC_BANK_ACCOUNT_BIC}`;
    qrCode += `\n${process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME}`;
    qrCode += `\n${process.env.NEXT_PUBLIC_BANK_ACCOUNT_IBAN}`;
    qrCode += `\n${process.env.NEXT_PUBLIC_BANK_ACCOUNT_CURRENCY}${amount}`;
    qrCode += `\n\n\n+++${process.env.NEXT_PUBLIC_BANK_ACCOUNT_REFERENCE_PREFIX}/${placeSlug}/${data}+++`;

    setBankQR(qrCode);
  };

  const handleCompleteOrder = async () => {
    if (!orderIdRef.current) {
      return;
    }

    completeOrderAction(orderIdRef.current);

    handleClear();
  };

  const handleCancelOrder = async () => {
    if (!orderIdRef.current) {
      return;
    }

    cancelOrderAction(orderIdRef.current);

    handleClear();
  };

  return (
    <div
      className="flex flex-col flex-1 w-full items-center"
      ref={containerRef}
    >
      {!bankQR && (
        <div className="w-full max-w-xs space-y-2 mt-4">
          <p className="text-sm text-gray-800">
            Generate a QR Code that users can scan with their bank app 📱.
          </p>
          <p className="text-sm text-gray-500">
            Payments are sent to the Brussels Pay account (
            {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME}).
          </p>
          <p className="text-sm text-gray-500">
            Bank payments can be slow 🐢 (especially on weekends).
          </p>
          <p className="text-sm text-gray-500">
            Make sure to double-check that the payment is completed on their
            side before marking the payment as &quot;paid&quot;.
          </p>
        </div>
      )}
      {size > 0 && bankQR && (
        <div className="bg-white relative flex flex-col items-center rounded-lg p-4 pt-8 border border-gray-200 shadow-md mt-8 animate-fade-in">
          <div className="absolute -top-5 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
            Bank App QR Code
          </div>
          <QRCodeSVG
            value={bankQR}
            size={size * 0.8}
            fgColor="#0c0c0c"
            bgColor="#ffffff"
            className="animate-fade-in"
            imageSettings={
              currencyLogo
                ? {
                    src: currencyLogo,
                    height: size * 0.1,
                    width: size * 0.1,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>
      )}
      <div className="w-full max-w-xs space-y-2 mt-8">
        {!loading && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <CurrencyLogo logo={currencyLogo} size={24} />
            </div>
            <Input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              value={amount || ""}
              onChange={handleCustomAmountChange}
              className="pl-12"
              autoFocus
              placeholder="Enter amount"
            />
          </div>
        )}
        {!loading && (
          <div>
            <Textarea
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}
        {!bankQR && !!amount && (
          <div className="flex justify-center">
            <Button onClick={generateBankQR} className="h-12">
              Generate Bank Code{" "}
              {!loading ? (
                <QrCode className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </Button>
          </div>
        )}

        {bankQR ? (
          <div className="flex justify-center">
            <Button onClick={handleCompleteOrder} className="h-12">
              Mark as &quot;paid&quot; <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
        {bankQR ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              className="h-12"
            >
              Cancel payment <X className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
