"use server";

import { getClientSecret } from "@/stripe/checkout";

export const getClientSecretAction = async (
  accountOrUsername: string,
  orderId: number,
  amount: number
) => {
  return getClientSecret(accountOrUsername, orderId, amount);
};
