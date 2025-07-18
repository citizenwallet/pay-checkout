import { Treasury } from "@/db/treasury";

export const createVivaRefund = async (
  treasury: Treasury<"viva">,
  transactionId: string,
  amount: number
) => {
  const basicAuth = Buffer.from(
    `${treasury.sync_provider_credentials.merchant_id}:${treasury.sync_provider_credentials.api_key}`
  ).toString("base64");

  const response = await fetch(
    `${process.env.VIVA_API_URL}/transactions/${transactionId}?amount=${amount}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  return response.ok;
};
