export const generateReceiveLink = (
  baseUrl: string,
  account: string,
  alias: string,
  amount?: string,
  description?: string
): string => {
  let url = `${baseUrl}/?sendto=${account}@${alias}`;
  if (amount) {
    url += `&amount=${amount}`;
  }

  if (description) {
    url += `&description=${encodeURIComponent(description)}`;
  }

  return url;
};
