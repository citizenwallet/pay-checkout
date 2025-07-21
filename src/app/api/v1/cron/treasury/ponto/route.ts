import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getPontoTreasuries } from "@/db/treasury";
import { PontoClient } from "@/services/ponto";
import { pontoTransactionToTreasuryOperation } from "@/services/ponto/transaction";
import { getTreasuryAccount } from "@/db/treasury_account";
import {
  getLatestTreasuryOperation,
  insertTreasuryOperations,
} from "@/db/treasury_operation";

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
    if (treasury.sync_strategy !== "payg") {
      continue;
    }

    const ponto = new PontoClient(
      treasury.sync_provider_credentials.client_id,
      treasury.sync_provider_credentials.client_secret
    );

    const { data: latestOperation, error: latestOperationError } =
      await getLatestTreasuryOperation(client, treasury.id);
    if (latestOperationError) {
      console.error(latestOperationError);
      continue;
    }

    const transactions = await ponto.getAllTransactionsUntilId(
      treasury.sync_provider_credentials.account_id,
      latestOperation?.id
    );

    const operations = transactions.map((transaction) =>
      pontoTransactionToTreasuryOperation(transaction, treasury.id, "pending")
    );

    for (const operation of operations) {
      const { data: taccount, error: messagesError } = await getTreasuryAccount(
        client,
        operation.message,
        treasury.id
      );

      if (messagesError) {
        console.error(messagesError);
        continue;
      }

      if (!taccount) {
        operation.status = "processed-account-not-found";
        continue;
      }

      operation.account = taccount.account;
    }

    await insertTreasuryOperations(client, operations);
  }

  return new NextResponse("treasuries synced", { status: 200 });
}
