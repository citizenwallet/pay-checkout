import { JsonRpcProvider } from "ethers";

export const waitForTxSuccess = async (
  rpcUrl: string,
  txHash: string
): Promise<boolean> => {
  try {
    const rpc = new JsonRpcProvider(rpcUrl);

    const receipt = await rpc.waitForTransaction(txHash);
    if (!receipt) {
      throw new Error("Transaction not found");
    }

    return receipt.status === 1;
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    return false;
  }
};
