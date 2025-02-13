import { getServiceRoleClient } from "@/db";
import { Suspense } from "react";
import Menu from "./Menu";
import Config from "@/cw/community.json";
import {
  CommunityConfig,
  getProfileFromAddress,
  ProfileWithTokenId,
  verifyAccountOwnership,
} from "@citizenwallet/sdk";
import { getItemsForPlace } from "@/db/items";
import { Metadata } from "next";
import { getPlaceWithProfile } from "@/lib/place";
import { redirect } from "next/navigation";
import { getOrder, Order } from "@/db/orders";
import TopUpSelector from "./TopUp";

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
      icon: "/favicon.ico",
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
    metadata.title = "Join Brussels Pay";
    metadata.description = "Verify your business to activate this code.";
    metadata.openGraph = {
      title: "Join Brussels Pay",
      description: "Verify your business to activate this code.",
      images: ["/shop.png"],
    };
    return metadata;
  }

  if (!place) {
    return metadata;
  }

  metadata.title = place.name;
  metadata.description = profile?.description ?? "Pay with Brussels Pay";
  metadata.openGraph = {
    title: place.name,
    description: profile?.description ?? "Pay with Brussels Pay",
    images: [place.image ?? profile?.image ?? "/shop.png"],
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
  sigAuthAccount,
  sigAuthExpiry,
  sigAuthSignature,
  sigAuthRedirect,
  orderId,
}: {
  account?: string;
  accountOrUsername: string;
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

      const message = `Signature auth for ${sigAuthAccount} with expiry ${sigAuthExpiry} and redirect ${encodeURIComponent(
        sigAuthRedirect
      )}`;

      const isOwner = await verifyAccountOwnership(
        community,
        sigAuthAccount,
        message,
        sigAuthSignature
      );
      if (!isOwner) {
        throw new Error("Invalid signature");
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

    return <div>Place not found</div>;
  }

  const { data: items } = await getItemsForPlace(client, place.id);

  let pendingOrder: Order | null = null;
  if (orderId) {
    const { data: orderData } = await getOrder(client, parseInt(orderId));
    if (orderData) {
      pendingOrder = orderData;
    }
  }

  if (place.display === "topup") {
    return (
      <TopUpSelector
        connectedAccount={connectedAccount}
        accountOrUsername={accountOrUsername}
        connectedProfile={connectedProfile}
        sigAuthRedirect={sigAuthRedirect}
        placeId={place.id}
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
