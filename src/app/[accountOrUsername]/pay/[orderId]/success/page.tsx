import { getServiceRoleClient } from "@/db";
import { getItemsForPlace } from "@/db/items";
import { getOrder } from "@/db/orders";
import Success from "./Success";
import { Item } from "@/db/items";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { track } from "@vercel/analytics/server";
import { getPlace } from "@/lib/place";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{ tx?: string; close?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader className="text-center flex flex-col items-center justify-center">
              <CardTitle className="text-2xl font-bold">
                Order Confirmed
              </CardTitle>
              <Skeleton className="h-8 w-[200px]" />
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Please show this to the vendor
              </p>
            </CardFooter>
          </Card>
        </div>
      }
    >
      <AsyncPage params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AsyncPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{ tx?: string; close?: string }>;
}) {
  const { accountOrUsername, orderId } = await params;
  const { tx, close } = await searchParams;

  const client = getServiceRoleClient();
  const { data, error } = await getOrder(client, orderId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    data.place_id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  const community = new CommunityConfig(Config);

  const { place } = await getPlace(client, accountOrUsername);
  if (place) {
    await track("order_paid", {
      slug: place.slug,
      amount: data.total,
    });
  }

  return (
    <Success
      accountOrUsername={accountOrUsername}
      order={data}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      currencyLogo={community.community.logo}
      tx={tx}
      close={close}
    />
  );
}
