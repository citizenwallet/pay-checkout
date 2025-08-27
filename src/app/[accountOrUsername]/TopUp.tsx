"use client";

import { useState } from "react";
import Config from "@/cw/community.json";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateOrder } from "../actions/generateOrder";
import { Loader2, Copy, Check } from "lucide-react";
import { ProfileWithTokenId } from "@citizenwallet/sdk";
import { PublicPontoTreasury, PublicStripeTreasury } from "@/db/treasury";
import { QRCodeSVG } from "qrcode.react";

const PRESET_AMOUNTS = [10, 20, 50, 100];
const CURRENCY_LOGO = Config.community.logo;

interface TopUpSelectorProps {
  connectedAccount?: string;
  accountOrUsername: string;
  connectedProfile?: ProfileWithTokenId | null;
  sigAuthRedirect?: string;
  placeId: number;
  stripeTreasury: PublicStripeTreasury | null;
  pontoTreasury: PublicPontoTreasury | null;
  treasuryAccountId: string | null;
  target: number | null;
}

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Function to generate BCD 002 SCT format QR code
const generateBCDQrCode = (
  iban: string,
  legalName: string,
  target: number | null,
  communication: string
): string => {
  // BCD 002 SCT format: BCD\n002\n1\nSCT\nBIC\nName\nIBAN\nAmount\nCommunication
  // We leave amount blank as requested
  const bic = ""; // BIC is optional for SEPA transfers
  const amount = target ? `${target / 100}` : ""; // Leave blank for user to fill in their bank app

  return `BCD\n002\n1\nSCT\n${bic}\n${legalName}\n${iban}\n${amount}\n\n\n${communication}`;
};

export default function TopUpSelector({
  connectedAccount,
  accountOrUsername,
  connectedProfile,
  sigAuthRedirect,
  placeId,
  stripeTreasury,
  pontoTreasury,
  treasuryAccountId,
  target,
}: TopUpSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [address, setAddress] = useState(connectedAccount || "");
  const [addressTouched, setAddressTouched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

  const handleClose = () => {
    if (sigAuthRedirect) {
      router.push(`?tax=no&close=${sigAuthRedirect}/close`);
    } else {
      router.back();
    }
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
        amount,
        connectedAccount ?? address,
        connectedAccount ? "app" : "web"
      );
      if (error || !data) {
        console.error(error);
        return;
      }

      let payUrl = `/${accountOrUsername}/pay/${data}`;
      if (sigAuthRedirect) {
        payUrl += `?tax=no&close=${sigAuthRedirect}/close`;
      }

      router.push(payUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const finalAmount =
    selectedAmount || (customAmount ? parseFloat(customAmount) : null);

  const showAddressError = addressTouched && !isValidEthereumAddress(address);

  // Generate QR code data for Ponto treasury
  const qrCodeData =
    pontoTreasury && treasuryAccountId
      ? generateBCDQrCode(
          pontoTreasury.iban,
          pontoTreasury.business.legal_name,
          target,
          treasuryAccountId
        )
      : "";

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

        {!stripeTreasury && !pontoTreasury && (
          <div className="text-sm text-destructive">
            No payment methods available
          </div>
        )}

        {pontoTreasury && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Top Up 🏛️</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your bank app to make a SEPA transfer
                </p>
                {qrCodeData && (
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={qrCodeData}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Bank Transfer Details</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">Legal Name</div>
                      <div className="text-muted-foreground">
                        {pontoTreasury.business.legal_name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(
                          pontoTreasury.business.legal_name,
                          "legalName"
                        )
                      }
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "legalName" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">IBAN</div>
                      <div className="text-muted-foreground font-mono">
                        {pontoTreasury.iban}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(pontoTreasury.iban, "iban")}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === "iban" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {pontoTreasury.target && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium">Target</div>
                        <div className="text-muted-foreground font-mono">
                          {((pontoTreasury?.target ?? 0) / 100).toFixed(2)} €
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            `${(pontoTreasury?.target ?? 0) / 100}`,
                            "target"
                          )
                        }
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "target" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  {treasuryAccountId && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium">Communication</div>
                        <div className="text-muted-foreground font-mono">
                          {treasuryAccountId.length === 12
                            ? `+++${treasuryAccountId.slice(
                                0,
                                3
                              )}/${treasuryAccountId.slice(
                                3,
                                7
                              )}/${treasuryAccountId.slice(7, 12)}+++`
                            : treasuryAccountId}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(treasuryAccountId, "communication")
                        }
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "communication" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Can take up to 4 hours to appear in your account
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Make sure to pick instant transfer
                </div>

                <Button
                  onClick={handleClose}
                  className={cn("w-full py-4 text-lg h-auto")}
                >
                  Transfer Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stripeTreasury && (
          <Card>
            <CardHeader>
              <CardTitle>Instant Top Up ⚡️</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Select Amount</Label>
                <div className="grid grid-cols-2 gap-4">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      onClick={() => handlePresetClick(amount)}
                      variant={
                        selectedAmount === amount ? "default" : "outline"
                      }
                      className={cn(
                        "p-4 text-lg h-auto",
                        selectedAmount === amount &&
                          "bg-primary hover:bg-primary/90"
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
                  <Label>Custom Amount</Label>
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
                  finalAmount && "bg-primary hover:bg-primary/90"
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
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
