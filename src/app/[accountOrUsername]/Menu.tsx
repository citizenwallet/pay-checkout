"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { PlusIcon, ShoppingCart } from "lucide-react";
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

interface VendorPageProps {
  place: Place;
  profile: Profile | null;
  items?: Item[];
  currencyLogo?: string;
}

export default function Menu({
  profile,
  items = [],
  currencyLogo,
}: VendorPageProps) {
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>(
    {}
  );
  const [activeCategory, setActiveCategory] = useState<string>("");
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  const headerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow max-w-md mx-auto w-full bg-white shadow-xl">
        <header
          ref={headerRef}
          className="p-4 bg-primary text-primary-foreground sticky top-0 z-10"
        >
          <div className="flex items-center gap-4">
            <Image
              src={profile?.image ?? "/shop.png"}
              alt={profile?.name ?? "Shop"}
              width={80}
              height={80}
              className="rounded-full h-16 w-16 object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{profile?.name ?? "Shop"}</h1>
              <p className="text-sm opacity-90">{profile?.description ?? ""}</p>
            </div>
          </div>
        </header>

        <div className="sticky top-[96px] bg-white z-10 border-b">
          <div className="overflow-x-auto">
            <div className="flex p-2 gap-2">
              {Object.keys(itemsByCategory).map((category) => (
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

        <main className="p-4 pb-12 space-y-4">
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
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
          ))}
        </main>

        {totalItems > 0 && (
          <div className="fixed bottom-4 right-4 left-4 max-w-md mx-auto">
            <Button className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Pay <CurrencyLogo logo={currencyLogo} size={16} />
              {formatCurrencyNumber(totalPrice)} for {totalItems} item
              {totalItems !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
