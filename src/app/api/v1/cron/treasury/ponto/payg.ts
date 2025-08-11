import { Treasury } from "@/db/treasury";
import { getTreasuryAccount, TreasuryAccount } from "@/db/treasury_account";
import {
  getLatestTreasuryOperation,
  insertTreasuryOperations,
} from "@/db/treasury_operation";
import { PontoClient } from "@/services/ponto";
import {
  extractIdFromMessage,
  pontoTransactionToTreasuryOperation,
} from "@/services/ponto/transaction";
import { SupabaseClient } from "@supabase/supabase-js";

export async function syncPontoTreasuryPayg(
  client: SupabaseClient,
  treasury: Treasury<"ponto">
): Promise<void> {
  const ponto = new PontoClient(
    treasury.sync_provider_credentials.client_id,
    treasury.sync_provider_credentials.client_secret
  );

  // get the latest operation for this treasury
  const { data: latestOperation, error: latestOperationError } =
    await getLatestTreasuryOperation(client, treasury.id);
  if (latestOperationError) {
    console.error(latestOperationError);
    return;
  }

  // get all transactions until the latest operation
  const transactions = await ponto.getAllTransactionsUntilId(
    treasury.sync_provider_credentials.account_id,
    latestOperation?.id
  );

  if (transactions.length === 0) {
    console.log("payg: no transactions to sync");
    return;
  }

  // map the transactions to treasury operations
  const operations = transactions.map((transaction) =>
    pontoTransactionToTreasuryOperation(transaction, treasury.id, "pending")
  );

  // map the account addresses to treasury accounts so we don't have to query the database for each operation
  const mappedTreasuryAccounts = new Map<string, TreasuryAccount | null>();
  // parse operations and determine the account address for each operation
  for (const operation of operations) {
    const key = `${operation.message}-${treasury.id}`;
    let taccount: TreasuryAccount | null | undefined =
      mappedTreasuryAccounts.get(key);

    if (taccount === undefined) {
      const { data: foundTaccount, error: messagesError } =
        await getTreasuryAccount(
          client,
          extractIdFromMessage(operation.message),
          treasury.id
        );

      if (messagesError) {
        console.error(messagesError);
        continue;
      }

      mappedTreasuryAccounts.set(key, foundTaccount);
      taccount = foundTaccount;
    }

    if (!taccount) {
      operation.status = "processed-account-not-found";
      continue;
    }

    operation.account = taccount.account;
  }

  // insert the operations into the database
  await insertTreasuryOperations(client, operations);
}
