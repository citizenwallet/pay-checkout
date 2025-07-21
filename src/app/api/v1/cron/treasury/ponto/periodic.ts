import { PeriodicSyncStrategyConfig, Treasury } from "@/db/treasury";
import {
  getTreasuryAccount,
  getTreasuryAccountTarget,
  TreasuryAccount,
} from "@/db/treasury_account";
import {
  getLatestTreasuryOperation,
  getPendingPeriodicTreasuryOperations,
  insertTreasuryOperations,
  processPeriodicTreasuryOperation,
} from "@/db/treasury_operation";
import { PontoClient } from "@/services/ponto";
import { pontoTransactionToTreasuryOperation } from "@/services/ponto/transaction";
import { SupabaseClient } from "@supabase/supabase-js";

export async function syncPontoTreasuryPeriodic(
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

  // map the transactions to treasury operations
  const operations = transactions.map((transaction) =>
    pontoTransactionToTreasuryOperation(
      transaction,
      treasury.id,
      "pending-periodic"
    )
  );

  // map the account addresses to treasury accounts so we don't have to query the database for each operation
  const mappedTreasuryAccounts = new Map<string, TreasuryAccount | null>();
  // parse operations and determine the account address for each operation
  for (const operation of operations) {
    const key = `${operation.message}-${treasury.id}`;
    let taccount: TreasuryAccount | null | undefined = null;
    if (mappedTreasuryAccounts.has(key)) {
      taccount = mappedTreasuryAccounts.get(key);
    }

    if (taccount === undefined) {
      const { data: taccount, error: messagesError } = await getTreasuryAccount(
        client,
        operation.message,
        treasury.id
      );

      if (messagesError) {
        console.error(messagesError);
        continue;
      }

      mappedTreasuryAccounts.set(key, taccount);
    }

    if (!taccount) {
      operation.status = "processed-account-not-found";
      continue;
    }

    operation.account = taccount.account;
  }

  // insert the operations into the database
  await insertTreasuryOperations(client, operations);

  // if the sync strategy config is not set, return
  if (treasury.sync_strategy_config === null) {
    return;
  }

  const syncStrategyConfig =
    treasury.sync_strategy_config as PeriodicSyncStrategyConfig;

  switch (syncStrategyConfig.interval_unit) {
    case "month":
      // monthly sync, determine on which day of the month to sync
      const dayOfMonth = syncStrategyConfig.day_of_month;
      if (!dayOfMonth) {
        console.error("day_of_month is required for monthly sync");
        break;
      }

      const now = new Date();

      // get the max date to sync until
      const maxDate = new Date(now);
      // set the date to the day of the month
      maxDate.setDate(dayOfMonth);
      // set the hour to the hour of the day
      maxDate.setHours(
        syncStrategyConfig.hour ?? 23,
        syncStrategyConfig.minute ?? 59,
        59,
        999
      );

      // parse the max date to a date object
      const syncMinDate = new Date(maxDate);
      // set hours to 0
      syncMinDate.setHours(0, 0, 0, 0);

      // we should only sync if we are in the sync window
      if (syncMinDate > now || maxDate < now) {
        console.log("month: not in sync window", syncMinDate, now, maxDate);
        break;
      }

      console.log("month: in sync window", syncMinDate, now, maxDate);

      // parse the max date to a date object
      const minDate = new Date(maxDate);
      // set the month to the previous month
      minDate.setMonth(minDate.getMonth() - 1);

      // get the periodic operations to sync
      const { data: periodicOperations, error: periodicOperationsError } =
        await getPendingPeriodicTreasuryOperations(
          client,
          treasury.id,
          minDate.toISOString(),
          maxDate.toISOString()
        );

      if (periodicOperationsError) {
        console.error(periodicOperationsError);
        break;
      }

      // if there are no periodic operations to sync, break
      if (periodicOperations.length === 0) {
        break;
      }

      // summarize total contributions per account during the period
      const mappedAccountTotals = periodicOperations.reduce(
        (acc, operation) => {
          if (!operation.account) {
            return acc;
          }
          acc[operation.account] =
            (acc[operation.account] || 0) + operation.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      // determine which accounts have reached their target
      const accountsTargetReached = new Set<string>();
      for (const [account, total] of Object.entries(mappedAccountTotals)) {
        // get the target for the account
        const { data: accountTarget } = await getTreasuryAccountTarget(
          client,
          treasury.id,
          account
        );

        // if the account target is not set, use the default target
        const target = accountTarget ?? syncStrategyConfig.target;

        // if the account total is less than the target, continue
        if (total < target) {
          console.log(
            "month: account not reached target",
            account,
            total,
            target
          );
          continue;
        }

        // if the account total is greater than or equal to the target, add the account to the set
        accountsTargetReached.add(account);
      }

      // process the periodic operations for the accounts that have reached their target
      for (const account of accountsTargetReached) {
        const accountOperations = periodicOperations.filter(
          (operation) => operation.account === account
        );

        if (accountOperations.length === 0) {
          continue;
        }

        // get the first operation and the rest of the operations
        const [firstOperation, ...groupedOperations] = accountOperations;

        // process the periodic operation
        await processPeriodicTreasuryOperation(
          client,
          firstOperation.id,
          treasury.id,
          groupedOperations.map((operation) => operation.id), // grouped operations
          syncStrategyConfig.reward // reward
        );
      }
    default:
      break;
  }
}
