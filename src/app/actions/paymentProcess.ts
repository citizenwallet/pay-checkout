"use server";

import { getClientSecret } from "@/stripe/checkout";

export const getClientSecretAction = async (amount: number) => {
  return getClientSecret(amount);
};
