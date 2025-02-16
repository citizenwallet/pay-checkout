import { VivaTransactionsResponse } from ".";

export const getTransaction = async (
  basicAuth: string,
  transactionId: string
) => {
  const response = await fetch(
    `https://www.vivapayments.com/api/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  if (response.status !== 200) {
    console.error("Error getting transaction", response.statusText);
    return null;
  }

  const data: VivaTransactionsResponse = await response.json();
  console.log("vava tx data", data);
  if (!data.Success) {
    console.error("Transaction not successful", data.ErrorText);
    return null;
  }

  if (data.Transactions.length === 0) {
    console.error("Transaction not found", transactionId);
    return null;
  }

  return data.Transactions[0];
};
