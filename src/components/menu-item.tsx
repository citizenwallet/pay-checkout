import Image from "next/image";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item } from "@/db/items";
import { formatCurrencyNumber } from "@/lib/currency";
import CurrencyLogo from "@/components/currency-logo";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  item?: Item;
  currencyLogo?: string;
  selectedItems: { [key: number]: number };
  adjustItemQuantity: (id: number, delta: number) => void;
  onImageClick: (image: string) => void;
}

export default function MenuItem({
  item,
  currencyLogo,
  selectedItems,
  adjustItemQuantity,
  onImageClick,
}: MenuItemProps) {
  if (!item) {
    return (
      <Card className="mb-4">
        <CardContent className="flex justify-start items-center gap-2 p-2 h-24">
          <div className="w-full text-center text-gray-400">
            Item not available
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlyAmount = (item.name === null || item.name === "") && !item.image;

  return (
    <Card
      key={item.id}
      className={`${selectedItems[item.id] ? "border-primary" : ""} mb-4`}
    >
      <CardContent className="flex justify-start items-center gap-2 p-2">
        {item.image && (
          <div className="pr-2 border-r">
            <Image
              src={item.image}
              alt={item.name || "Item"}
              width={80}
              height={80}
              className="rounded-md w-20 h-20 object-cover cursor-pointer"
              onClick={() => onImageClick(item.image!)}
            />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center items-start gap-2 min-h-20">
          {!onlyAmount ? (
            <>
              <p className="text-lg font-bold">{item.name}</p>
              <p className="text-sm">{item.description}</p>
            </>
          ) : (
            <div className="flex items-center gap-2 px-4">
              <CurrencyLogo logo={currencyLogo} size={24} />
              <p className="text-lg font-bold">
                {formatCurrencyNumber(item.price)}
              </p>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex flex-col items-end gap-2 h-20",
            !onlyAmount ? "justify-between" : "justify-end"
          )}
        >
          {!onlyAmount && (
            <div className="flex items-center gap-2">
              <CurrencyLogo logo={currencyLogo} size={24} />
              <p className="text-lg font-bold">
                {formatCurrencyNumber(item.price)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!selectedItems[item.id] ? (
              <Button
                variant="secondary"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
