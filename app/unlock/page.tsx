"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Eye, EyeOff, LogIn, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/store/useWalletStore";
import { loadWalletFromStorage, removeWalletFromStorage, decryptPrivateKey } from "@/lib/crypto";
import { shortenAddress } from "@/lib/wallet";

export default function UnlockPage() {
  const router = useRouter();
  const { wallet, isLocked, setWallet } = useWalletStore();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storedAddress, setStoredAddress] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadWalletFromStorage();
    if (!stored) {
      router.replace("/");
      return;
    }
    setStoredAddress(stored.address);

    // Already unlocked in this session — go straight to dashboard
    if (wallet && !isLocked) {
      router.replace("/dashboard");
    }
  }, [wallet, isLocked, router]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    const stored = loadWalletFromStorage();
    if (!stored) {
      router.replace("/");
      return;
    }

    setIsLoading(true);
    try {
      await decryptPrivateKey(stored.encryptedKey, password);
      setWallet(stored);
      router.push("/dashboard");
    } catch {
      toast.error("Incorrect password");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemoveWallet() {
    removeWalletFromStorage();
    toast.success("Wallet removed");
    router.replace("/");
  }

  if (!storedAddress) return null;

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {shortenAddress(storedAddress)}
            </p>
          </div>
        </div>

        {/* Unlock form */}
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your wallet password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 rounded-xl h-11 bg-card border-border"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl h-12 font-semibold"
            disabled={!password || isLoading}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isLoading ? "Unlocking..." : "Unlock Wallet"}
          </Button>
        </form>

        {/* Remove wallet */}
        <div className="w-full pt-2 border-t border-border flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground text-center">
            Not your wallet or forgot your password?
          </p>
          <button
            onClick={handleRemoveWallet}
            className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            Remove wallet from this device
          </button>
        </div>
      </div>
    </main>
  );
}
