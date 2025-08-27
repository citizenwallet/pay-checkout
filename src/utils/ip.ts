"use server";

import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");

  return forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
}
