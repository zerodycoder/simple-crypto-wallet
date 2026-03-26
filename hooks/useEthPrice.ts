import { useState, useEffect } from "react";

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPrice() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/price");
        const data = await res.json();
        if (data.usd) setPrice(data.usd);
      } catch {
        // silently fail — USD display is non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  function toUsd(ethAmount: string): string | null {
    if (!price || !ethAmount) return null;
    const usd = parseFloat(ethAmount) * price;
    return usd.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  return { price, isLoading, toUsd };
}
