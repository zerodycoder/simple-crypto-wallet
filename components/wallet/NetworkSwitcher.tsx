"use client";

import { useWalletStore } from "@/store/useWalletStore";
import { NetworkType } from "@/types/wallet";

export function NetworkSwitcher() {
  const { network, setNetwork } = useWalletStore();

  const networks: { value: NetworkType; label: string }[] = [
    { value: "sepolia", label: "Sepolia" },
    { value: "mainnet", label: "Mainnet" },
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary border border-border">
      {networks.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setNetwork(value)}
          className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
            network === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
