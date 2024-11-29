export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return "";

  if (address.length <= chars * 2) return address;

  const start = address.slice(0, chars);
  const end = address.slice(-chars);

  return `${start}...${end}`;
};
