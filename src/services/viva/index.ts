export const createVivaRefund = async (
    transactionId: string,
    amount: number
  ) => {
    const basicAuth = Buffer.from(
      `${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_API_KEY}`
    ).toString('base64');
  
    const response = await fetch(
      `${process.env.VIVA_API_URL}/transactions/${transactionId}?amount=${amount}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${basicAuth}`
        }
      }
    );
  
    return response.ok;
  };
  