import Image from "next/image";

export default function CurrencyLogo({
  logo,
  size = 32,
}: {
  logo?: string;
  size?: number;
}) {
  return (
    <Image
      src={logo ?? "/coin.png"}
      alt="Currency"
      width={size}
      height={size}
    />
  );
}
