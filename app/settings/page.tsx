"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Clock, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWalletStore } from "@/store/useWalletStore";
import { removeWalletFromStorage } from "@/lib/crypto";
import { LockTimeout, NetworkType } from "@/types/wallet";

const LOCK_OPTIONS: { value: LockTimeout; label: string }[] = [
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
];

const NETWORK_OPTIONS: { value: NetworkType; label: string }[] = [
  { value: "sepolia", label: "Sepolia Testnet" },
  { value: "mainnet", label: "Ethereum Mainnet" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { wallet, settings, updateSettings, clearWallet, setNetwork } = useWalletStore();

  useEffect(() => {
    if (!wallet) router.push("/");
  }, [wallet, router]);

  function handleLockTimeoutChange(value: LockTimeout) {
    updateSettings({ lockTimeout: value });
    toast.success("Auto-lock timeout updated");
  }

  function handleDefaultNetworkChange(value: NetworkType) {
    updateSettings({ defaultNetwork: value });
    setNetwork(value);
    toast.success("Default network updated");
  }

  function handleRemoveWallet() {
    removeWalletFromStorage();
    clearWallet();
    toast.success("Wallet removed from this device");
    router.push("/");
  }

  if (!wallet) return null;

  return (
    <main className="flex flex-col min-h-screen px-4 pb-8 pt-6 max-w-sm mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Go back"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Auto-lock */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Auto-lock</span>
        </div>
        <div className="flex flex-col gap-2">
          {LOCK_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleLockTimeoutChange(value)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                settings.lockTimeout === value
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-sm">{label}</span>
              {settings.lockTimeout === value && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Default network */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Default Network</span>
        </div>
        <div className="flex flex-col gap-2">
          {NETWORK_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleDefaultNetworkChange(value)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                settings.defaultNetwork === value
                  ? "bg-primary/15 border-primary/40 text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span className="text-sm">{label}</span>
              {settings.defaultNetwork === value && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </section>

      <Separator className="bg-border" />

      {/* Danger zone */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trash2 className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Danger Zone</span>
        </div>
        <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30">
          <p className="text-xs text-destructive mb-3">
            This removes your wallet from this device. Make sure you have your seed phrase backed up before proceeding.
          </p>
          <Button
            variant="destructive"
            className="w-full rounded-xl h-11"
            onClick={handleRemoveWallet}
          >
            Remove Wallet from Device
          </Button>
        </div>
      </section>
    </main>
  );
}
