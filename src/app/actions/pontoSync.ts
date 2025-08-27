"use server";

import { getServiceRoleClient } from "@/db";
import { getTreasury } from "@/db/treasury";
import { PontoClient } from "@/services/ponto";
import { getClientIp } from "@/utils/ip";

export async function pontoSyncAction(treasuryId: number) {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const client = getServiceRoleClient();

  const { data: treasury, error: treasuryError } = await getTreasury(
    client,
    treasuryId,
    "ponto"
  );
  if (treasuryError) {
    console.error(treasuryError);
    return;
  }

  if (!treasury) {
    console.error("treasury not found");
    return;
  }

  console.log("pontoSyncAction", treasuryId);
  const ip = await getClientIp();

  console.log("ip", ip);

  try {
    const ponto = new PontoClient(
      treasury.sync_provider_credentials.client_id,
      treasury.sync_provider_credentials.client_secret
    );

    const response = await ponto.syncPontoTransactions(
      treasury.sync_provider_credentials.account_id,
      ip
    );

    console.log("response", response);
  } catch (error) {
    console.error("pontoSyncAction error", error);
    return;
  }
}
