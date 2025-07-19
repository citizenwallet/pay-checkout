import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getPontoTreasuries } from "@/db/treasury";
import { PontoClient } from "@/services/ponto";
import { pontoTransactionToTreasuryOperation } from "@/services/ponto/transaction";
import { getTreasuryAccountMessage } from "@/db/treasury_account_message";
import { insertTreasuryOperations } from "@/db/treasury_operation";

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
    const ponto = new PontoClient(
      treasury.sync_provider_credentials.client_id,
      treasury.sync_provider_credentials.client_secret
    );

    const transactions = await ponto.getTransactions(
      treasury.sync_provider_credentials.account_id
    );

    // console.log("treasury", treasury.id, transactions.data);

    const operations = transactions.data.map((transaction) =>
      pontoTransactionToTreasuryOperation(transaction, treasury.id, "pending")
    );

    for (const operation of operations) {
      const { data: taccount, error: messagesError } =
        await getTreasuryAccountMessage(client, operation.message, treasury.id);

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

    console.log(operations);
    const { error: insertError } = await insertTreasuryOperations(
      client,
      operations
    );
    console.log(insertError);
  }

  return new NextResponse("treasuries synced", { status: 200 });
}
