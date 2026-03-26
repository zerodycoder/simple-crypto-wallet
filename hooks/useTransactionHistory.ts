import { useState, useEffect, useCallback } from "react";
import { ITransaction, NetworkType } from "@/types/wallet";

const ALCHEMY_URL: Record<NetworkType, string> = {
  sepolia: process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL!,
  mainnet: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL!,
};

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  metadata: { blockTimestamp: string };
  category: string;
}

async function fetchTransfers(
  url: string,
  filterKey: "fromAddress" | "toAddress",
  address: string
): Promise<AlchemyTransfer[]> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          [filterKey]: address,
          category: ["external"],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: "0x14",
          order: "desc",
        },
      ],
      id: 1,
    }),
  });

  const data = await res.json();
  return data?.result?.transfers ?? [];
}

export function useTransactionHistory(
  address: string | null,
  network: NetworkType
) {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = ALCHEMY_URL[network];

      const [sent, received] = await Promise.all([
        fetchTransfers(url, "fromAddress", address),
        fetchTransfers(url, "toAddress", address),
      ]);

      const toTx = (t: AlchemyTransfer): ITransaction => ({
        hash: t.hash,
        from: t.from,
        to: t.to ?? "",
        value: t.value ? t.value.toFixed(6) : "0",
        timestamp: t.metadata?.blockTimestamp
          ? new Date(t.metadata.blockTimestamp).getTime()
          : 0,
        status: "confirmed",
      });

      const merged = [...sent.map(toTx), ...received.map(toTx)];

      // Deduplicate by hash, sort newest first
      const seen = new Set<string>();
      const unique = merged
        .filter((tx) => {
          if (seen.has(tx.hash)) return false;
          seen.add(tx.hash);
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(unique);
    } catch {
      setError("Failed to fetch transaction history");
    } finally {
      setIsLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { transactions, isLoading, error, refetch: fetchHistory };
}
