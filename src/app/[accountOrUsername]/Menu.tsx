"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Loader2, PlusIcon, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Place } from "@/db/places";
import { ProfileWithTokenId, Profile } from "@citizenwallet/sdk";
import { Item } from "@/db/items";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";
import { useRouter } from "next/navigation";
import { generateOrder } from "../actions/generateOrder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateReceiveLink } from "@/cw/links";
import { formatAddress } from "@/lib/address";

interface VendorPageProps {
  alias?: string;
  accountOrUsername?: string;
  loading?: boolean;
  place?: Place;
  profile?: Profile | null;
  items?: Item[];
  currencyLogo?: string;
  connectedAccount?: string;
  connectedProfile?: ProfileWithTokenId | null;
  sigAuthRedirect?: string;
}

export default function Menu({
  alias,
  accountOrUsername,
  loading = false,
  place,
  profile,
  items = [],
  currencyLogo,
  connectedAccount,
  connectedProfile,
  sigAuthRedirect,
}: VendorPageProps) {
  const router = useRouter();

  const [loadingOrder, setLoadingOrder] = useState(false);

  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>(
    {}
  );
  const [activeCategory, setActiveCategory] = useState<string>("");
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const headerRef = useRef<HTMLDivElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const adjustItemQuantity = (id: number, delta: number) => {
    setSelectedItems((prev) => {
      const newState = { ...prev };
      const newQuantity = (newState[id] || 0) + delta;

      if (newQuantity <= 0) {
        delete newState[id];
      } else {
        newState[id] = newQuantity;
      }

      return newState;
    });
  };

  const totalItems = Object.values(selectedItems).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalPrice = items.reduce(
    (sum, item) => sum + (selectedItems[item.id] || 0) * item.price,
    0
  );

  const itemsByCategory = items.reduce(
    (acc: { [key: string]: Item[] }, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {}
  );

  const [customAmountInputRef, setCustomAmountInputRef] =
    useState<HTMLInputElement | null>(null);
  const [descriptionInputRef, setDescriptionInputRef] =
    useState<HTMLTextAreaElement | null>(null);

  const noItems = items.length === 0;

  useEffect(() => {
    if (noItems && customAmountInputRef) {
      setTimeout(() => {
        customAmountInputRef.focus();
      }, 250);
    }
  }, [noItems, customAmountInputRef]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("category-", ""));
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px",
      }
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (category: string) => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const element = categoryRefs.current[category];
    if (element) {
      const y =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        60;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
    }
  };

  const handleConnectedAccountPay = async (redirect: string) => {
    if (!connectedAccount || !sigAuthRedirect || !alias) {
      return;
    }

    const account = place?.accounts[0];
    if (!account) {
      return;
    }

    setLoadingOrder(true);

    try {
      const linkDescription = noItems
        ? description
        : Object.keys(selectedItems).reduce((acc, id, index) => {
            return `${acc}${index === 0 ? "" : ", "}${`${
              items.find((item) => item.id === parseInt(id))?.name
            } x ${selectedItems[parseInt(id)]}`}`;
          }, "");

      const receiveLink = generateReceiveLink(
        sigAuthRedirect,
        account,
        alias,
        noItems
          ? (parseFloat(customAmount) * 100).toString()
          : totalPrice.toString(),
        linkDescription
      );

      router.push(`${receiveLink}&success=${encodeURIComponent(redirect)}`);
    } catch (e) {
      console.error(e);
    }

    setLoadingOrder(false);
  };

  const handleGenerateOrder = async (): Promise<number | undefined> => {
    if (!place) {
      return;
    }

    if (noItems && customAmount) {
      const amount = parseFloat(customAmount) * 100;
      const { data, error } = await generateOrder(
        place.id,
        {},
        description,
        amount
      );
      if (error) {
        console.error(error);
        return;
      }

      return data;
    } else {
      const { data, error } = await generateOrder(
        place.id,
        selectedItems,
        description,
        totalPrice
      );
      if (error) {
        console.error(error);
        return;
      }

      return data;
    }
  };

  const handlePay = async () => {
    if (!place) {
      return;
    }

    setLoadingOrder(true);

    try {
      const orderId = await handleGenerateOrder();
      if (!orderId) {
        throw new Error("Failed to generate order");
      }

      const orderConfirmationLink = `/${accountOrUsername}/pay/${orderId}`;
      const baseUrl = window.location.origin;

      if (connectedAccount) {
        return handleConnectedAccountPay(`${baseUrl}${orderConfirmationLink}`);
      }

      router.push(orderConfirmationLink);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <Loader2 className="absolute z-10 top-1/2 left-1/2 h-12 w-12 animate-spin text-white" />
          <img
            src={selectedImage}
            alt="Full size"
            className="z-10 max-h-[90vh] max-w-[90vw] md:max-w-3xl object-contain rounded-md animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex-grow max-w-md mx-auto w-full bg-white shadow-xl">
        <header
          ref={headerRef}
          className="flex flex-col gap-4 p-4 bg-primary text-primary-foreground sticky top-0 z-10"
        >
          {connectedAccount && connectedProfile && (
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-green-400" />
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
          {connectedAccount && (
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded-full bg-green-400" />
              <div className="text-sm">{formatAddress(connectedAccount)}</div>
            </div>
          )}
          <div className="flex items-center gap-4">
            {loading && (
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
            )}
            {!loading && (
              <Image
                src={profile?.image ?? "/shop.png"}
                alt={profile?.name ?? place?.name ?? "Shop"}
                width={80}
                height={80}
                className="rounded-full h-16 w-16 object-cover"
              />
            )}
            {loading && (
              <div>
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-md" />
                <div className="h-5 w-48 bg-gray-200 animate-pulse rounded-md" />
              </div>
            )}
            {!loading && (
              <div>
                <h1 className="text-2xl font-bold">
                  {profile?.name ?? place?.name ?? "Shop"}
                </h1>
                <p className="text-sm opacity-90">
                  {profile?.description ?? ""}
                </p>
              </div>
            )}
          </div>
        </header>

        {!noItems && (
          <div
            className={cn(
              "sticky bg-white z-10 border-b",
              connectedAccount ? "top-[144px]" : "top-[96px]"
            )}
          >
            <div className="overflow-x-auto">
              <div className="flex p-2 gap-2">
                {loading &&
                  Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-10 w-24 bg-gray-200 animate-pulse rounded-full"
                    />
                  ))}
                {!loading &&
                  Object.keys(itemsByCategory).map((category) => (
                    <button
                      key={category}
                      onClick={() => scrollToCategory(category)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap ${
                        activeCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="p-4 pb-12 space-y-4">
            <div className="h-[28px] w-32 bg-gray-200 animate-pulse rounded-md mb-4" />
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-48 bg-gray-200 animate-pulse rounded-md"
              />
            ))}
          </div>
        )}
        {!loading && (
          <main className="p-4 pb-12 space-y-4">
            {noItems && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-lg min-h-[50vh]">
                <div className="w-full max-w-xs space-y-2">
                  <div className="text-lg mb-4">Enter an amount to pay</div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CurrencyLogo logo={currencyLogo} size={24} />
                    </div>
                    <Input
                      key="custom-amount"
                      type="text"
                      value={customAmount}
                      ref={setCustomAmountInputRef}
                      autoFocus
                      onChange={handleCustomAmountChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          descriptionInputRef?.focus();
                        }
                      }}
                      className="pl-12"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="mb-4">
                    <Textarea
                      placeholder="Enter a description"
                      value={description}
                      ref={setDescriptionInputRef}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!customAmount || loadingOrder}
                    onClick={handlePay}
                  >
                    {loadingOrder ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Confirm <CurrencyLogo logo={currencyLogo} size={16} />
                        {formatCurrencyNumber(
                          parseFloat(customAmount || "0") * 100
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {Object.entries(itemsByCategory).map(
              ([category, categoryItems]) => (
                <div
                  key={category}
                  id={`category-${category}`}
                  ref={(el) => {
                    if (el) categoryRefs.current[category] = el;
                  }}
                >
                  <h2 className="text-xl font-semibold mb-4">{category}</h2>
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`${
                        selectedItems[item.id] ? "border-primary" : ""
                      } mb-4`}
                    >
                      <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      {item.image && (
                        <div className="px-6 pb-4">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={400}
                            height={300}
                            className="rounded-md w-full h-48 object-cover cursor-pointer"
                            onClick={() => setSelectedImage(item.image!)}
                          />
                        </div>
                      )}
                      <CardContent className="flex justify-start items-center gap-2">
                        <CurrencyLogo logo={currencyLogo} size={24} />
                        <p className="text-lg font-bold">
                          {formatCurrencyNumber(item.price)}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-end items-center">
                        {!selectedItems[item.id] ? (
                          <Button
                            variant="outline"
                            onClick={() => adjustItemQuantity(item.id, 1)}
                          >
                            <PlusIcon className="h-4 w-4" /> Add to Cart
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => adjustItemQuantity(item.id, -1)}
                            >
                              -
                            </Button>
                            <span className="min-w-[2rem] text-center">
                              {selectedItems[item.id]}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => adjustItemQuantity(item.id, 1)}
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )
            )}
          </main>
        )}

        {totalItems > 0 && !noItems && (
          <div className="fixed bottom-4 right-4 left-4 max-w-md mx-auto">
            <Button
              className="w-full"
              size="lg"
              disabled={totalItems === 0}
              onClick={handlePay}
            >
              {loadingOrder && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {!loadingOrder && (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Confirm <CurrencyLogo logo={currencyLogo} size={16} />
                  {formatCurrencyNumber(totalPrice)} for {totalItems} item
                  {totalItems !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
