import Image from "next/image";

export default function CurrencyLogo({
  logo,
  size = 32,
  className,
}: {
  logo?: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={logo ?? "/coin.png"}
      alt="Currency"
      width={size}
      height={size}
      className={className}
    />
  );
}
