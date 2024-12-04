"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CurrencyLogo from "@/components/currency-logo";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { generateReceiveLink } from "@/cw/links";

const MAX_WIDTH = 448;

interface PayProps {
  baseUrl: string;
  alias: string;
  account: string;
  currencyLogo?: string;
}

export default function Pay({
  baseUrl,
  alias,
  account,
  currencyLogo,
}: PayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState(baseUrl);
  const [size, setSize] = useState(0);

  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounce(amount, 500);
  const [description, setDescription] = useState("");
  const [debouncedDescription] = useDebounce(description, 500);

  useEffect(() => {
    setTimeout(() => {
      const width = containerRef.current?.clientWidth ?? 150;
      setSize(width >= MAX_WIDTH ? MAX_WIDTH : width);
    }, 250);
  }, []);

  useEffect(() => {
    if (debouncedAmount || debouncedDescription) {
      const receiveLink = generateReceiveLink(
        baseUrl,
        account,
        alias,
        debouncedAmount,
        debouncedDescription
      );
      setUrl(receiveLink);
      setLoading(false);
    } else {
      setUrl(baseUrl);
      setLoading(false);
    }
  }, [debouncedAmount, debouncedDescription, baseUrl, account, alias]);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9.,]/g, "");
    const value = sanitized.replace(",", ".");

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setLoading(true);
      setAmount(value);
    }
  };

  const handleClear = () => {
    setLoading(true);
    setAmount("");
    setDescription("");
  };

  console.log("url", url);

  return (
    <div
      className="flex flex-col flex-1 w-full items-center"
      ref={containerRef}
    >
      {size > 0 && (
        <div className="bg-white relative flex flex-col items-center rounded-lg p-4 pt-8 border border-gray-200 shadow-md mt-8 animate-fade-in">
          <div className="absolute -top-5 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl">
            {debouncedAmount || debouncedDescription ? "Scan to pay" : "Menu"}
          </div>
          {!loading ? (
            <QRCodeSVG
              value={url}
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
          ) : (
            <div
              className="w-full h-full flex items-center justify-center animate-fade-in"
              style={{ height: size * 0.8, width: size * 0.8 }}
            >
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          )}
        </div>
      )}
      <div className="w-full max-w-xs space-y-2 mt-8">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <CurrencyLogo logo={currencyLogo} size={24} />
          </div>
          <Input
            type="text"
            inputMode="decimal"
            value={amount || ""}
            onChange={handleCustomAmountChange}
            className="pl-12"
            placeholder="Enter amount"
          />
        </div>
        <div>
          <Textarea
            placeholder="Enter a description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {debouncedAmount || debouncedDescription ? (
          <div className="flex justify-center">
            <Button onClick={handleClear}>
              Reset QR Code <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
