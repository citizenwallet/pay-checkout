"use server";

import * as z from "zod";

import { createBusiness } from "@/db/business";
import { createPlace, updatePlaceAccounts } from "@/db/places";
import { getServiceRoleClient } from "@/db";
import { joinFormSchema } from "../[accountOrUsername]/join/Join";
import { id } from "ethers";
import {
  CommunityConfig,
  getCardAddress,
  verifyAndSuggestUsername,
} from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { createSlug } from "@/lib/utils";
import { createUser, getUserByEmail } from "@/db/users";
import { sendMailAction } from "./sendMailAction";
import { upsertProfile } from "@/cw/profiles";
import { createBusinessUser } from "@/db/businessUser";

export async function joinAction(
  inviteCode: string,
  data: z.infer<typeof joinFormSchema>
  //   image?: File
) {
  const client = getServiceRoleClient();

  const email = data.email;

  // check if user exists
  const { data: user } = await getUserByEmail(client, email);

  if (user) {
    return { error: `User ${email} already exists` };
  }

  // send email
  const result = await sendMailAction(email, data.name, inviteCode);
  if (!result) {
    return { error: "Failed to send email" };
  }

  // create business in businesses table
  const { data: business, error: businessError } = await createBusiness(
    client,
    {
      name: data.name,
      status: null,
      vat_number: "",
      business_status: "created",
      email: data.email,
      phone: data.phone,
      invite_code: inviteCode,
    }
  );

  if (businessError) {
    return { error: businessError.message };
  }

  // create user in users table
  const { data: newUser, error: newUserError } = await createUser(
    client,
    email,
    business.id
  );

  if (newUserError) {
    return { error: newUserError.message };
  }

  if (!newUser) {
    return { error: "Failed to create user" };
  }

  const { error: businessUserError } = await createBusinessUser(
    client,
    newUser.id,
    business.id,
    "owner"
  );

  if (businessUserError) {
    return { error: businessUserError.message };
  }

  // Try to create a unique slug
  const baseSlug = createSlug(data.name);

  const community = new CommunityConfig(Config);

  const username = await verifyAndSuggestUsername(community, baseSlug);
  if (!username) {
    return { error: "Unable to generate unique slug for place" };
  }

  // create place in places table
  const { data: place, error: placeError } = await createPlace(client, {
    name: data.name,
    slug: username,
    business_id: business.id,
    accounts: [],
    invite_code: inviteCode,
    image: null,
    display: "amount",
    hidden: true,
  });

  if (placeError) {
    return { error: placeError.message };
  }

  if (!place) {
    return { error: "Failed to create place" };
  }

  const hashedSerial = id(`${business.id}:${place.id}`);

  const account = await getCardAddress(community, hashedSerial);
  if (!account) {
    return { error: "Failed to get account address" };
  }

  try {
    await upsertProfile(
      community,
      username,
      data.name,
      account,
      data.description,
      data.image
    );
  } catch (error) {
    console.error("Failed to upsert profile", error);
  }

  await updatePlaceAccounts(client, place.id, [account]);

  return { success: true };
}
