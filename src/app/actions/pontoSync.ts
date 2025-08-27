"use server";

import { getClientIp } from "@/utils/ip";

export async function pontoSyncAction(treasuryId: number) {
  console.log("pontoSyncAction", treasuryId);
  const ip = await getClientIp();

  console.log("ip", ip);
}
