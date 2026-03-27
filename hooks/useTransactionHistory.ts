import { useState, useEffect, useCallback, useRef } from "react";
import { ITransaction, NetworkType } from "@/types/wallet";

const ALCHEMY_URL: Record<NetworkType, string> = {
  sepolia: process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL!,
  mainnet: process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL!,
};

const PAGE_SIZE = "0x14"; // 20 per page

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  metadata: { blockTimestamp: string };
  category: string;
}

interface AlchemyResponse {
  transfers: AlchemyTransfer[];
  pageKey?: string;
}

async function fetchTransfers(
  url: string,
  filterKey: "fromAddress" | "toAddress",
  address: string,
  pageKey?: string
): Promise<AlchemyResponse> {
  const params: Record<string, unknown> = {
    fromBlock: "0x0",
    toBlock: "latest",
    [filterKey]: address,
    category: ["external"],
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: PAGE_SIZE,
    order: "desc",
  };
  if (pageKey) params.pageKey = pageKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [params],
      id: 1,
    }),
  });

  const data = await res.json();
  return {
    transfers: data?.result?.transfers ?? [],
    pageKey: data?.result?.pageKey,
  };
}

function toTx(t: AlchemyTransfer): ITransaction {
  return {
    hash: t.hash,
    from: t.from,
    to: t.to ?? "",
    value: t.value ? t.value.toFixed(6) : "0",
    timestamp: t.metadata?.blockTimestamp
      ? new Date(t.metadata.blockTimestamp).getTime()
      : 0,
    status: "confirmed",
  };
}

function mergeAndSort(existing: ITransaction[], incoming: ITransaction[]): ITransaction[] {
  const seen = new Set(existing.map((tx) => tx.hash));
  const unique = incoming.filter((tx) => {
    if (seen.has(tx.hash)) return false;
    seen.add(tx.hash);
    return true;
  });
  return [...existing, ...unique].sort((a, b) => b.timestamp - a.timestamp);
}

export function useTransactionHistory(
  address: string | null,
  network: NetworkType
) {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track page keys for sent and received independently
  const sentPageKey = useRef<string | undefined>(undefined);
  const receivedPageKey = useRef<string | undefined>(undefined);

  const fetchHistory = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    sentPageKey.current = undefined;
    receivedPageKey.current = undefined;

    try {
      const url = ALCHEMY_URL[network];
      const [sent, received] = await Promise.all([
        fetchTransfers(url, "fromAddress", address),
        fetchTransfers(url, "toAddress", address),
      ]);

      sentPageKey.current = sent.pageKey;
      receivedPageKey.current = received.pageKey;
      setHasMore(!!(sent.pageKey || received.pageKey));

      const merged = mergeAndSort([], [
        ...sent.transfers.map(toTx),
        ...received.transfers.map(toTx),
      ]);
      setTransactions(merged);
    } catch {
      setError("Failed to fetch transaction history");
    } finally {
      setIsLoading(false);
    }
  }, [address, network]);

  const loadMore = useCallback(async () => {
    if (!address || isLoadingMore) return;
    if (!sentPageKey.current && !receivedPageKey.current) return;

    setIsLoadingMore(true);
    try {
      const url = ALCHEMY_URL[network];
      const [sent, received] = await Promise.all([
        sentPageKey.current
          ? fetchTransfers(url, "fromAddress", address, sentPageKey.current)
          : Promise.resolve({ transfers: [], pageKey: undefined }),
        receivedPageKey.current
          ? fetchTransfers(url, "toAddress", address, receivedPageKey.current)
          : Promise.resolve({ transfers: [], pageKey: undefined }),
      ]);

      sentPageKey.current = sent.pageKey;
      receivedPageKey.current = received.pageKey;
      setHasMore(!!(sent.pageKey || received.pageKey));

      const incoming = [...sent.transfers.map(toTx), ...received.transfers.map(toTx)];
      setTransactions((prev) => mergeAndSort(prev, incoming));
    } catch {
      setError("Failed to load more transactions");
    } finally {
      setIsLoadingMore(false);
    }
  }, [address, network, isLoadingMore]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { transactions, isLoading, isLoadingMore, hasMore, error, refetch: fetchHistory, loadMore };
}
