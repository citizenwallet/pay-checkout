import { getServiceRoleClient } from "@/db";
import { getItemsForPlace, Item } from "@/db/items";
import { attachTxHashToOrder, getOrderWithBusiness } from "@/db/orders";
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
import { CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlace } from "@/lib/place";
import { getTreasuryByBusinessId } from "@/db/treasury";
import ElementsWrapper from "../ElementsWrapper";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{
    tx?: string;
    close?: string;
    customOrderId?: string;
    successUrl?: string;
    errorUrl?: string;
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
    successUrl?: string;
    errorUrl?: string;
  }>;
}) {
  const { accountOrUsername, orderId } = await params;
  const {
    tx,
    close,
    tax = "yes",
    customOrderId,
    successUrl,
    errorUrl,
  } = await searchParams;

  const client = getServiceRoleClient();
  const { data, error } = await getOrderWithBusiness(client, orderId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>Order not found</div>;
  }

  if (data.status === "paid") {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Order Completed!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Thank you for your purchase. Your order has been successfully
              processed.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Order ID:</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Status:</span>
                <span className="text-green-600 font-semibold">Paid</span>
              </div>
              {data.completed_at && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Completed:</span>
                  <span>{new Date(data.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500 text-center">
              Please show this confirmation to the vendor
            </p>
          </CardFooter>
        </Card>
      </div>
    );
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

  if (!data || !data.token) {
    return <div>Order not found</div>;
  }

  const { data: treasury, error: treasuryError } =
    await getTreasuryByBusinessId(
      client,
      "stripe",
      data.place.business.id,
      data.token
    );

  if (treasuryError) {
    return <div>Error: {treasuryError.message}</div>;
  }

  if (!treasury) {
    return <div>Treasury not found</div>;
  }

  return (
    <ElementsWrapper
      publishableKey={treasury.sync_provider_credentials.publishable_key}
    >
      <Summary
        publishableKey={treasury.sync_provider_credentials.publishable_key}
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
        successUrl={successUrl}
        errorUrl={errorUrl}
      />
    </ElementsWrapper>
  );
}
