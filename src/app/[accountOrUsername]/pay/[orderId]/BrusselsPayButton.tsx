"use client";

import { Button } from "@/components/ui/button";
import CurrencyLogo from "@/components/currency-logo";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  errorOpenAppAction,
  installAppAction,
  retryOpenAppAction,
  tryOpenAppAction,
} from "./actions";
import { Order } from "@/db/orders";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface BrusselsPayButtonProps {
  order?: Order;
  accountOrUsername: string;
  currencyLogo?: string;
  isTopUp?: boolean;
  successUrl?: string;
  errorUrl?: string;
}

export default function BrusselsPayButton({
  order,
  accountOrUsername,
  currencyLogo,
  isTopUp,
  successUrl,
  errorUrl,
}: BrusselsPayButtonProps) {
  const [showAppStoreLinks, setShowAppStoreLinks] = useState<boolean>(false);
  const [isAttemptingToOpen, setIsAttemptingToOpen] = useState<boolean>(false);
  const [hasAutoAttempted, setHasAutoAttempted] = useState<boolean>(false);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);

  const attemptToOpenApp = useCallback(
    async (retried: boolean = false) => {
      if (!order) return;

      if (retried) {
        retryOpenAppAction();
      }

      // Set states for user feedback
      setIsAttemptingToOpen(true);
      setShowAppStoreLinks(false);

      try {
        const appScheme = process.env.NEXT_PUBLIC_APP_SCHEME;
        if (!appScheme) {
          throw new Error("No app scheme");
        }

        let hasAppOpened = false;
        let fallbackTimer: NodeJS.Timeout | null = null;

        // Track page visibility to detect if app opened
        const handleVisibilityChange = () => {
          if (document.hidden) {
            hasAppOpened = true;
            if (fallbackTimer) {
              clearTimeout(fallbackTimer);
            }
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );
            setIsAttemptingToOpen(false);
          }
        };

        const showFallback = () => {
          if (!hasAppOpened) {
            setShowAppStoreLinks(true);
          }
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
          errorOpenAppAction();
          setIsAttemptingToOpen(false);
        };

        // Set up visibility detection
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Build app URL
        let appUrl = `${appScheme}checkout.pay.brussels/${accountOrUsername}?orderId=${order.id}`;

        if (successUrl) {
          appUrl += `&successUrl=${successUrl}`;
        }

        if (errorUrl) {
          appUrl += `&errorUrl=${errorUrl}`;
        }

        // Try to open the app using location.href (more reliable than window.open)
        window.location.href = appUrl;

        // Fallback timer - if app doesn't open within 2 seconds, show app store links
        fallbackTimer = setTimeout(showFallback, 2000);
      } catch (error) {
        console.log("failed to open app");
        console.error(error);
        setShowAppStoreLinks(true);
        errorOpenAppAction();
        setIsAttemptingToOpen(false);
      }
    },
    [order, accountOrUsername, successUrl, errorUrl]
  );

  const handleBrusselsPay = useCallback(() => {
    // Just open the modal, don't attempt to open app yet
    setIsSheetOpen(true);
    setIsAttemptingToOpen(false);
    setShowAppStoreLinks(false);
  }, []);

  // Auto-attempt to open app on component mount, but only once
  useEffect(() => {
    if (!hasAutoAttempted && order && !isTopUp) {
      tryOpenAppAction();
      setHasAutoAttempted(true);
      handleBrusselsPay();
    }
  }, [hasAutoAttempted, order, isTopUp, handleBrusselsPay]);

  // Attempt to open app when modal opens
  useEffect(() => {
    if (isSheetOpen && !isAttemptingToOpen && !showAppStoreLinks) {
      attemptToOpenApp(false);
    }
  }, [isSheetOpen, isAttemptingToOpen, showAppStoreLinks, attemptToOpenApp]);

  const handleAppStore = () => {
    installAppAction("app-store");
    window.open(process.env.NEXT_PUBLIC_APP_STORE_URL, "_blank");
  };

  const handlePlayStore = () => {
    installAppAction("play-store");
    window.open(process.env.NEXT_PUBLIC_PLAY_STORE_URL, "_blank");
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setShowAppStoreLinks(false);
    setIsAttemptingToOpen(false);
  };

  if (isTopUp) {
    return null;
  }

  return (
    <>
      {/* Standard Pay with Brussels Pay button */}
      <Button
        onClick={handleBrusselsPay}
        disabled={isAttemptingToOpen}
        className="flex items-center gap-2 w-full h-14 text-white disabled:opacity-70"
      >
        <span className="font-medium text-lg">Pay with</span>
        <CurrencyLogo logo={currencyLogo} size={24} />
        <span className="font-medium text-lg">Brussels Pay</span>
      </Button>

      {/* Success message */}
      <div className="flex justify-center items-center gap-2 mt-2">
        <p className="text-sm py-2 px-4 bg-green-300 text-green-900 rounded-full">
          100% goes to vendor
        </p>
      </div>

      {/* Bottom Sheet with all secondary functionality */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Brussels Pay</SheetTitle>
            <SheetDescription>
              {isAttemptingToOpen
                ? "Attempting to open the Brussels Pay app..."
                : "We were unable to open the app automatically"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 mt-6">
            {/* Loading indicator when trying to open the app */}
            {isAttemptingToOpen && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg font-medium">Opening app...</span>
              </div>
            )}

            {/* Try again button */}
            {!isAttemptingToOpen && (
              <Button
                onClick={() => attemptToOpenApp(true)}
                disabled={isAttemptingToOpen}
                className="flex items-center gap-2 w-full h-14 text-white disabled:opacity-70"
              >
                <span className="font-medium text-lg">Try again with</span>
                <CurrencyLogo logo={currencyLogo} size={24} />
                <span className="font-medium text-lg">Brussels Pay</span>
              </Button>
            )}

            {/* App store buttons */}
            {showAppStoreLinks && (
              <>
                <div className="flex justify-center items-center gap-2 my-4">
                  <p className="text-lg font-medium">Get the App</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAppStore}
                    className="flex justify-center items-center gap-2 w-full h-14 bg-slate-900 hover:bg-slate-700 text-white"
                  >
                    <span className="font-medium text-lg">iOS</span>
                    <Image
                      src="/app_store.svg"
                      alt="App Store"
                      width={24}
                      height={24}
                    />
                  </Button>
                  <Button
                    onClick={handlePlayStore}
                    className="flex justify-center items-center gap-2 w-full h-14 bg-slate-900 hover:bg-slate-700 text-white"
                  >
                    <span className="font-medium text-lg">Android</span>
                    <Image
                      src="/play_store.svg"
                      alt="Google Play"
                      width={24}
                      height={24}
                    />
                  </Button>
                </div>
              </>
            )}

            {/* Close modal button */}
            <Button
              onClick={handleCloseSheet}
              variant="outline"
              className="w-full h-12 mt-4"
            >
              Use traditional payments
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
