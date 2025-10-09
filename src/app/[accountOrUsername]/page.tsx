import { getServiceRoleClient } from "@/db";
import { Suspense } from "react";
import Menu from "./Menu";
import PlaceNotFound from "@/components/PlaceNotFound";
import Config from "@/cw/community.json";
import {
  CommunityConfig,
  getProfileFromAddress,
  ProfileWithTokenId,
} from "@citizenwallet/sdk";
import { getItemsForPlace } from "@/db/items";
import { Metadata } from "next";
import { getPlaceWithProfile } from "@/lib/place";
import { redirect } from "next/navigation";
import { createOrder, getOrderWithBusiness, Order } from "@/db/orders";
import TopUpSelector from "./TopUp";
import {
  getPublicPontoTreasuryByBusinessId,
  getPublicStripeTreasuryByBusinessId,
} from "@/db/treasury";
import {
  createTreasuryAccount,
  getNextTreasuryAccountId,
  getTreasuryAccountByAccount,
} from "@/db/treasury_account";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountOrUsername: string }>;
}): Promise<Metadata> {
  const { accountOrUsername } = await params;
  const metadata: Metadata = {
    title: "Place not found",
    description: "This place has not been claimed yet.",
    icons: {
      icon: `/favicon/${accountOrUsername}`,
    },
    openGraph: {
      title: "Place not found",
      description: "This place has not been claimed yet.",
      images: ["/shop.png"],
    },
  };

  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  const { place, profile, inviteCode } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

  if (inviteCode && !place) {
    const faviconImage = "/shop.png";
    metadata.title = "Join Brussels Pay";
    metadata.description = "Verify your business to activate this code.";
    metadata.icons = {
      icon: `/favicon/${accountOrUsername}`,
    };
    metadata.openGraph = {
      title: "Join Brussels Pay",
      description: "Verify your business to activate this code.",
      images: [faviconImage],
    };
    return metadata;
  }

  if (!place) {
    return metadata;
  }

  const faviconImage = place.image ?? profile?.image ?? "/shop.png";
  metadata.title = place.name;
  metadata.description = profile?.description ?? "Pay with Brussels Pay";
  metadata.icons = {
    icon: `/favicon/${accountOrUsername}`,
  };
  metadata.openGraph = {
    title: place.name,
    description: profile?.description ?? "Pay with Brussels Pay",
    images: [faviconImage],
    type: "website",
  };

  return metadata;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ accountOrUsername: string }>;
  searchParams: Promise<{
    account?: string;
    orderId?: string;
    amount?: string;
    token?: string;
    description?: string;
    successUrl?: string;
    errorUrl?: string;
    sigAuthAccount?: string;
    sigAuthExpiry?: string;
    sigAuthSignature?: string;
    sigAuthRedirect?: string;
  }>;
}) {
  const { accountOrUsername } = await params;
  const {
    account,
    orderId,
    amount,
    token,
    description,
    successUrl,
    errorUrl,
    sigAuthAccount,
    sigAuthExpiry,
    sigAuthSignature,
    sigAuthRedirect,
  } = await searchParams;

  // TODO: remove when app is fixed
  let parsedOrderId = orderId;
  let parsedSigAuthAccount = sigAuthAccount;
  if (orderId && orderId.includes("?")) {
    const orderIdParts = orderId.split("?");
    console.log("orderIdParts", orderIdParts);
    if (orderIdParts.length === 2) {
      parsedOrderId = orderIdParts[0];
      parsedSigAuthAccount = orderIdParts[1].replace("sigAuthAccount=", "");
    }
  }

  return (
    <div>
      <Suspense fallback={<Menu config={Config} loading />}>
        <PlacePage
          account={account}
          accountOrUsername={accountOrUsername}
          amount={amount}
          tokenAddress={token}
          description={description}
          successUrl={successUrl}
          errorUrl={errorUrl}
          sigAuthAccount={parsedSigAuthAccount}
          sigAuthExpiry={sigAuthExpiry}
          sigAuthSignature={sigAuthSignature}
          sigAuthRedirect={sigAuthRedirect}
          orderId={parsedOrderId}
        />
      </Suspense>
    </div>
  );
}

async function PlacePage({
  account,
  accountOrUsername,
  amount,
  tokenAddress,
  description,
  successUrl,
  errorUrl,
  sigAuthAccount,
  sigAuthExpiry,
  sigAuthSignature,
  sigAuthRedirect,
  orderId,
}: {
  account?: string;
  accountOrUsername: string;
  amount?: string;
  tokenAddress?: string;
  description?: string;
  successUrl?: string;
  errorUrl?: string;
  sigAuthAccount?: string;
  sigAuthExpiry?: string;
  sigAuthSignature?: string;
  sigAuthRedirect?: string;
  orderId?: string;
}) {
  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  let connectedAccount: string | undefined;
  if (sigAuthAccount && sigAuthExpiry && sigAuthSignature && sigAuthRedirect) {
    // Verify the signature matches the account
    try {
      if (new Date().getTime() > new Date(sigAuthExpiry).getTime()) {
        throw new Error("Signature expired");
      }
      connectedAccount = sigAuthAccount;
    } catch (e) {
      console.error("Failed to verify signature:", e);
      // You might want to handle this error case appropriately
    }
  }
  if (account) {
    connectedAccount = account;
  }

  let connectedProfile: ProfileWithTokenId | null = null;
  if (connectedAccount) {
    connectedProfile = await getProfileFromAddress(
      process.env.IPFS_DOMAIN!,
      community,
      connectedAccount
    );
  }

  const { place, profile, inviteCode } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

  if (!place) {
    if (inviteCode) {
      redirect(`/${accountOrUsername}/join`);
    }

    return <PlaceNotFound accountOrUsername={accountOrUsername} />;
  }

  const { data: items } = await getItemsForPlace(client, place.id);

  const token = community.getToken(tokenAddress);

  if (!orderId && amount && successUrl && errorUrl) {
    const { data: orderData } = await createOrder(
      client,
      place.id,
      parseInt(amount ?? 0) * 100,
      [],
      description ?? "",
      null,
      "web",
      null,
      token.address
    );

    if (orderData) {
      redirect(
        `/${accountOrUsername}/pay/${
          orderData.id
        }?successUrl=${encodeURIComponent(
          successUrl
        )}&errorUrl=${encodeURIComponent(errorUrl)}`
      );
    }
  }

  let pendingOrder: Order | null = null;
  if (orderId) {
    const { data: orderData } = await getOrderWithBusiness(
      client,
      parseInt(orderId)
    );
    if (orderData) {
      pendingOrder = orderData;
    }
  }

  if (place.display === "topup") {
    const { data: stripeTreasury } = await getPublicStripeTreasuryByBusinessId(
      client,
      place.business_id,
      token.address
    );
    let { data: pontoTreasury } = await getPublicPontoTreasuryByBusinessId(
      client,
      place.business_id,
      token.address
    );

    let treasuryAccountId: string | null = null;
    let target: number | null = pontoTreasury?.target ?? null;
    if (pontoTreasury && connectedAccount) {
      const { data: treasuryAccount } = await getTreasuryAccountByAccount(
        client,
        pontoTreasury.id,
        connectedAccount
      );

      treasuryAccountId = treasuryAccount?.id ?? null;
      target = treasuryAccount?.target ?? target ?? null;
      if (!treasuryAccountId) {
        const nextTreasuryAccount = await getNextTreasuryAccountId(
          client,
          pontoTreasury.id
        );

        const { data: newTreasuryAccount } = await createTreasuryAccount(
          client,
          nextTreasuryAccount,
          pontoTreasury.id,
          connectedAccount,
          target,
          connectedProfile?.name ?? null,
          null
        );

        treasuryAccountId = newTreasuryAccount?.id ?? null;
        target = newTreasuryAccount?.target ?? target ?? null;
      }
    }

    if (!treasuryAccountId) {
      // something went wrong creating an account id, disable ponto
      pontoTreasury = null;
    }

    return (
      <TopUpSelector
        connectedAccount={connectedAccount}
        accountOrUsername={accountOrUsername}
        connectedProfile={connectedProfile}
        sigAuthRedirect={sigAuthRedirect}
        placeId={place.id}
        stripeTreasury={stripeTreasury}
        pontoTreasury={pontoTreasury}
        treasuryAccountId={treasuryAccountId}
        target={target}
      />
    );
  }

  return (
    <Menu
      config={Config}
      alias={community.community.alias}
      accountOrUsername={accountOrUsername}
      place={place}
      profile={profile}
      items={items ?? []}
      currencyLogo={community.community.logo}
      connectedAccount={connectedAccount}
      connectedProfile={connectedProfile}
      sigAuthRedirect={sigAuthRedirect}
      pendingOrder={pendingOrder}
    />
  );
}
