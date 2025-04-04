"use server";

import * as z from "zod";

import { createBusiness } from "@/db/business";
import { createPlace } from "@/db/places";
import { getServiceRoleClient } from "@/db";
import { joinFormSchema } from "../[accountOrUsername]/join/Join";
import { Wallet } from "ethers";
import { getAccountAddress, CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { createSlug, generateRandomString } from "@/lib/utils";
import { createUser, getUserByEmail } from "@/db/users";
import { sendMailAction } from "./sendMailAction";

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

  // generate a throwaway private key
  const newPk = Wallet.createRandom();
  const address = newPk.address;

  const community = new CommunityConfig(Config);

  // get account address from throwaway private key
  const account = await getAccountAddress(community, address);
  if (!account) {
    return { error: "Failed to get account address" };
  }

  // create business in businesses table
  const { data: business, error: businessError } = await createBusiness(
    client,
    {
      name: data.name,
      status: null,
      vat_number: "",
      business_status: "created",
      account,
      email: data.email,
      phone: data.phone,
      invite_code: inviteCode,
    }
  );

  if (businessError) {
    return { error: businessError.message };
  }

  // create user in users table
  const { error: newUserError } = await createUser(client, email, business.id);

  if (newUserError) {
    return { error: newUserError.message };
  }

  // Try to create a unique slug
  const baseSlug = createSlug(data.name);
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 5;

  // Keep trying until we find a unique slug or hit max attempts
  while (attempts < maxAttempts) {
    const { data: existingPlace } = await client
      .from("places")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!existingPlace) {
      break;
    }

    // If place exists, try a new random string
    slug = `${baseSlug}-${generateRandomString(4)}`;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { error: "Unable to generate unique slug for place" };
  }

  // create place in places table
  const { error: placeError } = await createPlace(client, {
    name: data.name,
    slug,
    business_id: business.id,
    accounts: [account],
    invite_code: inviteCode,
    image: null,
    display: "amount",
    hidden: true,
  });

  if (placeError) {
    return { error: placeError.message };
  }

  return { success: true };
}
