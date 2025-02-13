"use client";

import { useState } from "react";
import Config from "@/cw/community.json";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateOrder } from "../actions/generateOrder";
import { confirmTopUpAction } from "../actions/confirmTopUp";
import { Loader2 } from "lucide-react";
import { ProfileWithTokenId } from "@citizenwallet/sdk";

const PRESET_AMOUNTS = [10, 20, 50, 100];
const CURRENCY_LOGO = Config.community.logo;

interface TopUpSelectorProps {
  connectedAccount?: string;
  accountOrUsername: string;
  connectedProfile?: ProfileWithTokenId | null;
  sigAuthRedirect?: string;
  placeId: number;
}

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function TopUpSelector({
  connectedAccount,
  accountOrUsername,
  connectedProfile,
  sigAuthRedirect,
  placeId,
}: TopUpSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [address, setAddress] = useState(connectedAccount || "");
  const [addressTouched, setAddressTouched] = useState(false);
  const router = useRouter();

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (!addressTouched) setAddressTouched(true);
  };

  const handleAddressBlur = () => {
    setAddressTouched(true);
  };

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEthereumAddress(address) || !finalAmount) return;

    try {
      setLoading(true);

      let amount = parseFloat(customAmount) * 100;
      if (selectedAmount) {
        amount = selectedAmount * 100;
      }
      const { data, error } = await generateOrder(
        placeId,
        {},
        "Top up",
        amount
      );
      if (error || !data) {
        console.error(error);
        return;
      }

      let closeUrl: string | undefined;
      if (sigAuthRedirect) {
        closeUrl = `${sigAuthRedirect}/close`;
      }

      const session = await confirmTopUpAction(
        connectedAccount ?? address,
        accountOrUsername,
        data,
        amount,
        closeUrl
      );

      if (!session?.url) {
        console.error(error);
        return;
      }

      router.push(session.url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finalAmount =
    selectedAmount || (customAmount ? parseFloat(customAmount) : null);

  const showAddressError = addressTouched && !isValidEthereumAddress(address);

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold">Top Up Account</h2>

        {connectedAccount && connectedProfile && (
          <div className="flex items-center gap-4">
            <Image
              src={connectedProfile.image}
              alt={connectedProfile.name}
              width={20}
              height={20}
              className="rounded-full h-8 w-8 object-cover"
            />
            {connectedProfile.name ? (
              <div className="text-sm">
                {connectedProfile.name} (@{connectedProfile.username})
              </div>
            ) : (
              <div className="text-sm">@{connectedProfile.username}</div>
            )}
          </div>
        )}

        {!connectedAccount && (
          <div className="space-y-2">
            <Label htmlFor="address" className="flex justify-between">
              <span>Account Address</span>
              {showAddressError && (
                <span className="text-sm text-destructive">
                  Invalid Ethereum address
                </span>
              )}
            </Label>
            <Input
              id="address"
              placeholder="Enter address (0x...)"
              value={address}
              onChange={handleAddressChange}
              onBlur={handleAddressBlur}
              className={cn(
                "w-full",
                showAddressError &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>
        )}

        <div className="space-y-4">
          <Label>Select Amount</Label>
          <div className="grid grid-cols-2 gap-4">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                type="button"
                onClick={() => handlePresetClick(amount)}
                variant={selectedAmount === amount ? "default" : "outline"}
                className={cn(
                  "p-4 text-lg h-auto",
                  selectedAmount === amount && "bg-black hover:bg-black/90"
                )}
              >
                <Image
                  src={CURRENCY_LOGO}
                  alt="Currency"
                  width={20}
                  height={20}
                  className="inline-block"
                />
                <span className="text-xl font-bold">{amount}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customAmount">Custom Amount</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Image
                  src={CURRENCY_LOGO}
                  alt="Currency"
                  width={16}
                  height={16}
                  className="inline-block"
                />
              </div>
              <Input
                key="customAmount"
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") {
                    return;
                  }

                  if (!isValidEthereumAddress(address) || !finalAmount) {
                    return;
                  }

                  handleSubmit(e);
                }}
                className="pl-12"
                placeholder="Enter amount"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isValidEthereumAddress(address) || !finalAmount}
          className={cn(
            "w-full py-4 text-lg h-auto",
            finalAmount && "bg-black hover:bg-black/90"
          )}
        >
          {finalAmount ? (
            <>
              Top up{" "}
              <Image
                src={CURRENCY_LOGO}
                alt="Currency"
                width={20}
                height={20}
                className="inline-block mx-2"
              />
              <span className="text-xl font-bold">{finalAmount}</span>
            </>
          ) : (
            "Select an amount"
          )}
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </form>
    </div>
  );
}
