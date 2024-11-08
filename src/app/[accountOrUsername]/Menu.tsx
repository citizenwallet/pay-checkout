"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Place } from "@/db/places";
import { Profile } from "@citizenwallet/sdk";

interface Item {
  id: number;
  name: string;
  price: number;
  description: string;
}

interface VendorPageProps {
  place: Place;
  profile: Profile | null;
  items?: Item[];
}

export default function Menu({
  place,
  profile,
  items = [
    { id: 1, name: "Espresso", price: 2.5, description: "Strong and bold" },
    { id: 2, name: "Cappuccino", price: 3.5, description: "Creamy and frothy" },
    { id: 3, name: "Latte", price: 3.75, description: "Smooth and milky" },
    {
      id: 4,
      name: "Americano",
      price: 2.75,
      description: "Classic and simple",
    },
  ],
}: VendorPageProps) {
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>(
    {}
  );

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow max-w-md mx-auto w-full bg-white shadow-xl">
        <header className="p-4 bg-primary text-primary-foreground">
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

        <main className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          {items.map((item) => (
            <Card
              key={item.id}
              className={selectedItems[item.id] ? "border-primary" : ""}
            >
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">${item.price.toFixed(2)}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                {!selectedItems[item.id] ? (
                  <Button
                    variant="outline"
                    onClick={() => adjustItemQuantity(item.id, 1)}
                  >
                    Add to Cart
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
        </main>

        {totalItems > 0 && (
          <div className="fixed bottom-4 right-4 left-4 max-w-md mx-auto">
            <Button className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Pay ${totalPrice.toFixed(2)} for {totalItems} item
              {totalItems !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
