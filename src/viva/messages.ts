export const getMessagesConfigToken = async (basicAuth: string) => {
  const response = await fetch(
    `https://www.vivapayments.com/api/messages/config/token`,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  const data = await response.json();

  const verificationKey = data["Key"];
  if (!verificationKey) {
    return null;
  }

  return verificationKey;
};
