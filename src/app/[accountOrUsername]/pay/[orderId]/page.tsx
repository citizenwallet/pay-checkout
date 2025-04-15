import { getServiceRoleClient } from "@/db";
import { getItemsForPlace, Item } from "@/db/items";
import { attachTxHashToOrder, getOrder } from "@/db/orders";
import Summary from "./Summary";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { redirect } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { Suspense } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlace } from "@/lib/place";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{
    tx?: string;
    close?: string;
    customOrderId?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader className="flex flex-row items-center justify-start gap-4">
              <CardTitle className="text-2xl font-bold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch">
              <Button
                variant="outline"
                disabled
                className="w-full h-14 text-lg mb-4"
              >
                Cancel Order
              </Button>
              <Button disabled className="w-full h-14 text-lg">
                Pay <CreditCard className="h-4 w-4 ml-2" />
              </Button>
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
  searchParams: Promise<{
    tx?: string;
    close?: string;
    tax?: "yes" | "no";
    customOrderId?: string;
  }>;
}) {
  const { accountOrUsername, orderId } = await params;
  const { tx, close, tax = "yes", customOrderId } = await searchParams;

  const client = getServiceRoleClient();
  const { data, error } = await getOrder(client, orderId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>Order not found</div>;
  }

  if (data.status === "paid") {
    return <div>Order {orderId} completed</div>;
  }

  if (!data.tx_hash && tx) {
    data.tx_hash = tx;
    await attachTxHashToOrder(client, orderId, tx);

    let successLink = `/${accountOrUsername}/pay/${orderId}/success?tx=${tx}`;

    if (close) {
      successLink += `&close=${encodeURIComponent(close)}`;
    }

    await track("app_pay_success", {
      slug: data.place_id,
      amount: data.total,
    });

    redirect(successLink);
  }

  const { data: items, error: itemsError } = await getItemsForPlace(
    client,
    data.place_id
  );

  if (itemsError) {
    return <div>Error: {itemsError.message}</div>;
  }

  if (!items) {
    return <div>Items not found</div>;
  }

  const community = new CommunityConfig(Config);

  const place = await getPlace(client, accountOrUsername);
  if (!place.place) {
    return <div>Error: Place not found</div>;
  }

  return (
    <Summary
      accountOrUsername={accountOrUsername}
      order={data}
      items={items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as { [key: number]: Item })}
      currencyLogo={community.community.logo}
      tx={tx}
      customOrderId={customOrderId}
      closeUrl={close}
      tax={tax}
      isTopUp={place.place?.display === "topup"}
    />
  );
}
