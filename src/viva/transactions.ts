import { VivaTransaction, VivaLegacyTransactionsResponse } from ".";

export const getVivaTransaction = async (
  transactionId: string
): Promise<VivaTransaction | null> => {
  const accessToken = await getVivaAccessToken();

  const response = await fetch(
    `https://api.vivapayments.com/checkout/v2/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status !== 200) {
    console.error("Error getting transaction", response.statusText);
    return null;
  }

  const data: VivaTransaction = await response.json();

  return data;
};

const getVivaAccessToken = async () => {
  const basicAuth = Buffer.from(
    `${process.env.VIVA_CLIENT_ID}:${process.env.VIVA_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.vivapayments.com/connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();

  return data.access_token;
};

export const getFullTransaction = async (transactionId: string) => {
  const basicAuth = Buffer.from(
    `${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_API_KEY}`
  ).toString("base64");

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

  const data: VivaLegacyTransactionsResponse = await response.json();
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
