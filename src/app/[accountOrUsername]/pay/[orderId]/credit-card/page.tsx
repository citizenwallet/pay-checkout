import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServiceRoleClient } from "@/db";
import { getOrder } from "@/db/orders";
import { getClientSecret } from "@/stripe/checkout";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CreditCard from "./credit-card";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getTreasuryByBusinessId } from "@/db/treasury";
import ElementsWrapper from "../../ElementsWrapper";

export default async function CreditCardPayment({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string; orderId: number }>;
  searchParams: Promise<{ close?: string }>;
}) {
  const { orderId, accountOrUsername } = await params;
  const { close } = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-lg">
            <CardHeader className="flex flex-row items-center justify-start gap-4">
              <CardTitle className="text-2xl font-bold">
                Enter Credit Card Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </ul>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AsyncPage
        orderId={orderId}
        accountOrUsername={accountOrUsername}
        close={close}
      />
    </Suspense>
  );
}

async function AsyncPage({
  orderId,
  accountOrUsername,
  close,
}: {
  orderId: number;
  accountOrUsername: string;
  close?: string;
}) {
  const client = getServiceRoleClient();
  const { data, error } = await getOrder(client, orderId);
  if (error) {
    return <div>Error: {error.message}</div>;
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

  const clientSecret = await getClientSecret(
    accountOrUsername,
    orderId,
    data?.total ?? 0
  );

  if (!clientSecret) {
    redirect(`/${accountOrUsername}/pay/${orderId}`);
  }

  const community = new CommunityConfig(Config);

  return (
    <ElementsWrapper
      publishableKey={treasury.sync_provider_credentials.publishable_key}
    >
      <CreditCard
        publishableKey={treasury.sync_provider_credentials.publishable_key}
        clientSecret={clientSecret}
        order={data}
        accountOrUsername={accountOrUsername}
        currencyLogo={community.community.logo}
        closeUrl={close}
      />
    </ElementsWrapper>
  );
}
