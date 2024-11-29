export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return "";

  if (address.length <= chars * 2) return address;

  const formattedAddress = address.replace("0x", "");

  const start = formattedAddress.slice(0, chars);
  const end = formattedAddress.slice(-chars);

  return `0x${start}...${end}`;
};
