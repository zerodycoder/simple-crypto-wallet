import { useState, useEffect, useCallback } from "react";
import { getProvider } from "@/lib/provider";
import { formatEth } from "@/lib/wallet";
import { NetworkType } from "@/types/wallet";

export function useBalance(address: string | null, network: NetworkType) {
  const [balance, setBalance] = useState<string>("0.000000");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = getProvider(network);
      const raw = await provider.getBalance(address);
      setBalance(formatEth(raw));
    } catch {
      setError("Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, isLoading, error, refetch: fetchBalance };
}
