import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getPontoTreasuries } from "@/db/treasury";
import { syncPontoTreasuryPayg } from "./payg";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const client = getServiceRoleClient();

  const { data: treasuries, error } = await getPontoTreasuries(client);

  if (error) {
    return new Response("Error", {
      status: 500,
    });
  }

  if (treasuries.length === 0) {
    return new Response("No treasuries to sync", {
      status: 200,
    });
  }

  for (const treasury of treasuries) {
    switch (treasury.sync_strategy) {
      case "payg":
        await syncPontoTreasuryPayg(client, treasury);
        break;
      case "periodic":
        // await syncPontoTreasuryPeriodic(
        //   client,
        //   treasury as unknown as Treasury<"ponto", "periodic">
        // );
        break;
      default:
        console.error(`Unknown sync strategy: ${treasury.sync_strategy}`);
        break;
    }
  }

  return new NextResponse("treasuries synced", { status: 200 });
}
