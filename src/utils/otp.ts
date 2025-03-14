export async function generateOtp(count: number): Promise<number> {
  return Math.floor(
    10 ** (count - 1) +
      Math.random() * (9 * 10 ** (count - 1) - 10 ** (count - 1))
  );
}
