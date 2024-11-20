import "server-only";

import { getPlacesByBusinessId, Place } from "@/db/places";

import { getPlacesByAccount } from "@/db/places";
import { getPlaceByUsername } from "@/db/places";
import {
  getProfileFromAddress,
  getProfileFromUsername,
  Profile,
  CommunityConfig,
} from "@citizenwallet/sdk";
import { SupabaseClient } from "@supabase/supabase-js";
import { getBusinessByInviteCode } from "@/db/business";

export const getPlaceWithProfile = async (
  client: SupabaseClient,
  community: CommunityConfig,
  accountOrUsername: string
): Promise<{
  place: Place | null;
  profile: Profile | null;
  inviteCode: boolean;
}> => {
  let place: Place | null = null;
  let profile: Profile | null = null;
  let inviteCode = false;
  if (accountOrUsername.startsWith("0x")) {
    const { data } = await getPlacesByAccount(client, accountOrUsername);
    place = data?.[0] ?? null;

    profile = place
      ? await getProfileFromAddress(community, accountOrUsername)
      : null;
  } else if (accountOrUsername.startsWith("invite-")) {
    inviteCode = true;

    const { data: business } = await getBusinessByInviteCode(
      client,
      accountOrUsername
    );
    if (!business) {
      return { place: null, profile: null, inviteCode };
    }

    const { data } = await getPlacesByBusinessId(client, business.id);
    // TODO: handle multiple places
    place = data?.[0] ?? null;

    profile = place
      ? await getProfileFromUsername(community, place.slug)
      : null;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;

    profile = place
      ? await getProfileFromUsername(community, place.slug)
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

    const { data: business } = await getBusinessByInviteCode(
      client,
      accountOrUsername
    );

    if (!business) {
      return { place: null, inviteCode };
    }

    const { data } = await getPlacesByBusinessId(client, business.id);

    // TODO: handle multiple places
    place = data?.[0] ?? null;
  } else {
    const { data } = await getPlaceByUsername(client, accountOrUsername);
    place = data ?? null;
  }

  return { place, inviteCode };
};
