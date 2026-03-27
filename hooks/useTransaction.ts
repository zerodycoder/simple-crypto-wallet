import { useState } from "react";
import { ethers } from "ethers";
import { getSigner } from "@/lib/provider";
import { decryptPrivateKey } from "@/lib/crypto";
import { useWalletStore } from "@/store/useWalletStore";
import { ITransaction } from "@/types/wallet";

interface ISendParams {
  to: string;
  amount: string;
  password: string;
}

export function useTransaction() {
  const { wallet, network, addTransaction } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTransaction = async ({ to, amount, password }: ISendParams) => {
    if (!wallet) return null;
    setIsLoading(true);
    setError(null);

    try {
      const privateKey = await decryptPrivateKey(wallet.encryptedKey, password);
      const signer = getSigner(privateKey, network);

      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      const pendingTx: ITransaction = {
        hash: tx.hash,
        from: wallet.address,
        to,
        value: amount,
        timestamp: Date.now(),
        status: "pending",
      };

      addTransaction(pendingTx);

      const receipt = await tx.wait();

      const confirmedTx: ITransaction = {
        ...pendingTx,
        status: receipt?.status === 1 ? "confirmed" : "failed",
        gasUsed: receipt?.gasUsed.toString(),
      };

      addTransaction(confirmedTx);
      return confirmedTx;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const estimateGas = async (to: string, amount: string): Promise<string> => {
    if (!wallet) return "0";
    try {
      const provider = getSigner("0x0000000000000000000000000000000000000000000000000000000000000001", network).provider!;
      const [gasUnits, feeData] = await Promise.all([
        provider.estimateGas({
          from: wallet.address,
          to,
          value: ethers.parseEther(amount || "0"),
        }),
        provider.getFeeData(),
      ]);
      // Use base + priority for expected cost; fall back to gasPrice for legacy networks
      const baseFee = feeData.lastBaseFeePerGas ?? 0n;
      const priorityFee = feeData.maxPriorityFeePerGas ?? 0n;
      const effectivePrice = baseFee + priorityFee > 0n
        ? baseFee + priorityFee
        : (feeData.gasPrice ?? 0n);
      const gasCost = gasUnits * effectivePrice;
      return ethers.formatEther(gasCost);
    } catch {
      return "0";
    }
  };

  return { sendTransaction, estimateGas, isLoading, error };
}
