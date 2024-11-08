export function formatCurrencyNumber(amount: number): string {
  // Convert from cents to decimal amount
  const decimalAmount = amount / 100;

  // Try to get browser locale, fallback to env variable or 'en-US' as last resort
  const locale =
    (typeof window !== "undefined" && navigator.language) ||
    process.env.NEXT_PUBLIC_LOCALE ||
    "en-US";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalAmount);
}
