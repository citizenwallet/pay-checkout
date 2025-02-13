"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CurrencyLogo from "@/components/currency-logo";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2, RefreshCcw, X, Zap } from "lucide-react";
import { generateOrder } from "@/app/actions/generateOrder";
import { getOrderStatus } from "@/app/actions/getOrderStatuts";
import { OrderStatus } from "@/db/orders";
import { cancelOrderAction } from "@/app/actions/cancelOrder";
import { useToast } from "@/hooks/use-toast";
const MAX_WIDTH = 448;

interface PayProps {
  baseUrl: string;
  placeId?: number;
  currencyLogo?: string;
}

export default function Pay({ baseUrl, placeId, currencyLogo }: PayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(baseUrl);
  const [size, setSize] = useState(0);

  const orderIdRef = useRef<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);

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
    setLoading(false);
    setAmount("");
    setDescription("");
    if (amountRef.current) {
      amountRef.current.focus();
    }
  };

  const generateOrderLink = async () => {
    if (!placeId) {
      return;
    }

    setLoading(true);
    setOrderStatus("pending");

    const parsedAmount = parseFloat(amount) * 100;
    const { data, error } = await generateOrder(
      placeId,
      {},
      description,
      parsedAmount,
      null,
      "web"
    );
    if (error || !data) {
      console.error(error);
      return;
    }

    orderIdRef.current = data;
    setUrl(`${baseUrl}?orderId=${data}`);

    intervalRef.current = setInterval(() => {
      getOrderStatus(data)
        .then(({ data }) => {
          const status = data?.status ?? "pending";
          console.log("status", status);
          if (status === "cancelled") {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            setLoading(false);
            setOrderStatus(null);
            setUrl(baseUrl);
            toast({ title: "Payment cancelled" });
            return;
          }

          if (status === "paid") {
            toast({ title: "Payment successful" });
            setOrderStatus("paid");

            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            orderIdRef.current = null;

            setTimeout(() => {
              setLoading(false);
              setOrderStatus(null);
              setUrl(baseUrl);
            }, 2000);
          }
        })
        .catch((e) => {
          console.error(e);
          orderIdRef.current = null;

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          setLoading(false);
          setOrderStatus(null);
          setUrl(baseUrl);
        });
    }, 1000);
  };

  const handleCancelOrder = async () => {
    if (!orderIdRef.current) {
      return;
    }

    cancelOrderAction(orderIdRef.current);

    orderIdRef.current = null;

    setLoading(false);
    setOrderStatus(null);
    setUrl(baseUrl);
  };

  console.log("url", url);

  return (
    <div
      className="flex flex-col flex-1 w-full items-center"
      ref={containerRef}
    >
      {size > 0 && (
        <div className="bg-white relative flex flex-col items-center rounded-lg p-4 pt-8 border border-gray-200 shadow-md mt-8 animate-fade-in">
          <div className="absolute -top-5 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
            {orderStatus === null && !amount && "Menu"}
            {orderStatus === null && amount && "Scan to pay"}
            {orderStatus === "pending" && "Scan to pay"}
            {orderStatus === "paid" && "Order paid"}
            {orderStatus === "pending" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>
          {((!amount && !loading && orderStatus === null) ||
            (loading && orderStatus === "pending")) && (
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
          )}
          {loading && orderStatus === "paid" && (
            <div
              className="w-full h-full flex flex-col items-center justify-center animate-fade-in"
              style={{ height: size * 0.8, width: size * 0.8 }}
            >
              <CheckCheck className="w-10 h-10 text-green-500" />
            </div>
          )}
          {!loading && orderStatus === null && !!amount && (
            <div
              className="w-full h-full flex flex-col items-center justify-center animate-fade-in"
              style={{ height: size * 0.8, width: size * 0.8 }}
            >
              <Button
                onClick={generateOrderLink}
                className="mb-4 h-12 font-bold"
              >
                Request Instant Payment <Zap className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="mt-6 h-12"
              >
                Reset QR Code <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="w-full max-w-xs space-y-2 mt-8">
        {orderStatus === null && (
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
              placeholder="Enter amount"
            />
          </div>
        )}
        {orderStatus === null && (
          <div>
            <Textarea
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {orderStatus !== null ? (
          <div className="flex justify-center">
            <Button onClick={handleCancelOrder} className="h-12">
              Cancel Order <X className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
