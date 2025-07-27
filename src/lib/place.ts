import "server-only";

import {
  getPlaceById,
  getPlaceByInviteCode,
  getPlaceIdByInviteCode,
  getPlaceIdByUsername,
  getPlaceIdsByAccount,
  Place,
  PlaceWithItems,
} from "@/db/places";

import { getPlacesByAccount } from "@/db/places";
import { getPlaceByUsername } from "@/db/places";
import {
  getProfileFromAddress,
  getProfileFromUsername,
  Profile,
  CommunityConfig,
} from "@citizenwallet/sdk";
import { SupabaseClient } from "@supabase/supabase-js";

export const getPlaceWithProfile = async (
  client: SupabaseClient,
  community: CommunityConfig,
  accountOrUsername: string
): Promise<{
  place: PlaceWithItems | null;
  profile: Profile | null;
  inviteCode: boolean;
}> => {
  let place: PlaceWithItems | null = null;
  let profile: Profile | null = null;
  let inviteCode = false;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlacesByAccount(client, accountOrUsername);
    place = data?.[0] ?? null;

    profile = place
      ? await getProfileFromAddress(
          process.env.IPFS_DOMAIN!,
          community,
          accountOrUsername
        )
      : null;
  } else if (accountOrUsername.startsWith("invite-")) {
    inviteCode = true;

    const { data } = await getPlaceByInviteCode(client, accountOrUsername);
    if (!data) {
      return { place: null, profile: null, inviteCode };
    }

    place = data;

    profile = place
      ? await getProfileFromUsername(
          process.env.IPFS_DOMAIN!,
          community,
          place.slug
        )
      : null;
  } else if (!isNaN(parseInt(accountOrUsername))) {
    const { data } = await getPlaceById(client, parseInt(accountOrUsername));
    if (!data) {
      return { place: null, profile: null, inviteCode };
    }

    place = data;

    profile = place
      ? await getProfileFromUsername(
          process.env.IPFS_DOMAIN!,
          community,
          place.slug
        )
      : null;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;

    profile = place
      ? await getProfileFromUsername(
          process.env.IPFS_DOMAIN!,
          community,
          place.slug
        )
      : null;
  }

  return { place, profile, inviteCode };
};

export const getPlace = async (
  client: SupabaseClient,
  accountOrUsername: string
): Promise<{
  place: Place | null;
  inviteCode: boolean;
}> => {
  let place: Place | null = null;
  let inviteCode = false;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlacesByAccount(client, accountOrUsername);
    place = data?.[0] ?? null;
  } else if (accountOrUsername.startsWith("invite-")) {
    inviteCode = true;

    const { data } = await getPlaceByInviteCode(client, accountOrUsername);

    if (!data) {
      return { place: null, inviteCode };
    }

    place = data;
  } else if (!isNaN(parseInt(accountOrUsername))) {
    const { data } = await getPlaceById(client, parseInt(accountOrUsername));
    if (!data) {
      return { place: null, inviteCode };
    }

    place = data;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;
  }

  return { place, inviteCode };
};

export const getPlaceId = async (
  client: SupabaseClient,
  accountOrUsername: string
): Promise<number | null> => {
  let id: number | null = null;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlaceIdsByAccount(client, accountOrUsername);
    id = data?.[0]?.id ?? null;
  } else if (accountOrUsername.startsWith("invite-")) {
    const { data } = await getPlaceIdByInviteCode(client, accountOrUsername);

    if (!data) {
      return null;
    }

    id = data.id;
  } else if (!isNaN(parseInt(accountOrUsername))) {
    const { data } = await getPlaceById(client, parseInt(accountOrUsername));
    if (!data) {
      return null;
    }

    id = data.id;
  } else {
    const { data } = await getPlaceIdByUsername(client, accountOrUsername);
    id = data?.id ?? null;
  }

  return id;
};
