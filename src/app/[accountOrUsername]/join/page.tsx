import { Metadata } from "next";
import SignUp from "./Join";
import { CommunityConfig } from "@citizenwallet/sdk";
import { getPlace, getPlaceWithProfile } from "@/lib/place";
import { getServiceRoleClient } from "@/db";
import Config from "@/cw/community.json";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountOrUsername: string }>;
}): Promise<Metadata> {
  const { accountOrUsername } = await params;
  const metadata: Metadata = {
    title: "Join Brussels Pay",
    description: `Verify your business to activate this code (${accountOrUsername}).`,
    icons: {
      icon: `/favicon/${accountOrUsername}`,
    },
    openGraph: {
      title: "Join Brussels Pay",
      description: `Verify your business to activate this code (${accountOrUsername}).`,
      images: ["/shop.png"],
    },
  };

  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  const { place, profile } = await getPlaceWithProfile(
    client,
    community,
    accountOrUsername
  );

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
}: {
  params: Promise<{ accountOrUsername: string }>;
}) {
  const { accountOrUsername } = await params;
  const client = getServiceRoleClient();

  const { place, inviteCode } = await getPlace(client, accountOrUsername);

  if (place || !inviteCode) {
    redirect(`/${accountOrUsername}`);
  }

  return <SignUp inviteCode={accountOrUsername} />;
}
