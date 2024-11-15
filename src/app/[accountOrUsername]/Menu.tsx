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
import { Profile } from "@citizenwallet/sdk";
import { Item } from "@/db/items";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";
import { useRouter } from "next/navigation";
import { generateOrder } from "../actions/generateOrder";
import { Input } from "@/components/ui/input";

interface VendorPageProps {
  accountOrUsername?: string;
  loading?: boolean;
  place?: Place;
  profile?: Profile | null;
  items?: Item[];
  currencyLogo?: string;
}

export default function Menu({
  accountOrUsername,
  loading = false,
  place,
  profile,
  items = [],
  currencyLogo,
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

  const handlePay = async () => {
    if (!place) {
      return;
    }

    setLoadingOrder(true);

    if (noItems && customAmount) {
      const amount = parseFloat(customAmount) * 100;
      const { data, error } = await generateOrder(place.id, {}, amount);
      if (error) {
        console.error(error);
      } else {
        router.push(`/${accountOrUsername}/pay/${data}`);
      }
    } else {
      const { data, error } = await generateOrder(
        place.id,
        selectedItems,
        totalPrice
      );
      if (error) {
        console.error(error);
      } else {
        router.push(`/${accountOrUsername}/pay/${data}`);
      }
    }

    setLoadingOrder(false);
  };

  const noItems = items.length === 0;

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
          className="p-4 bg-primary text-primary-foreground sticky top-0 z-10"
        >
          <div className="flex items-center gap-4">
            {loading && (
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
            )}
            {!loading && (
              <Image
                src={profile?.image ?? "/shop.png"}
                alt={profile?.name ?? "Shop"}
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
                  {profile?.name ?? "Shop"}
                </h1>
                <p className="text-sm opacity-90">
                  {profile?.description ?? ""}
                </p>
              </div>
            )}
          </div>
        </header>

        {!noItems && (
          <div className="sticky top-[96px] bg-white z-10 border-b">
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
              <div className="flex-1 flex flex-col items-center justify-center text-center text-lg">
                Enter an amount to pay
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

        {(totalItems > 0 || noItems) && (
          <div className="fixed bottom-4 right-4 left-4 max-w-md mx-auto">
            {noItems ? (
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CurrencyLogo logo={currencyLogo} size={24} />
                  </div>
                  <Input
                    key="custom-amount"
                    type="text"
                    value={customAmount}
                    autoFocus
                    onChange={handleCustomAmountChange}
                    className="pl-12"
                    placeholder="Enter amount"
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
                      Pay <CurrencyLogo logo={currencyLogo} size={16} />
                      {formatCurrencyNumber(
                        parseFloat(customAmount || "0") * 100
                      )}
                    </>
                  )}
                </Button>
              </div>
            ) : (
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
                    Pay <CurrencyLogo logo={currencyLogo} size={16} />
                    {formatCurrencyNumber(totalPrice)} for {totalItems} item
                    {totalItems !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
