"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, Eye, EyeOff, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWalletStore } from "@/store/useWalletStore";
import { useTransaction } from "@/hooks/useTransaction";
import { useEthPrice } from "@/hooks/useEthPrice";
import { shortenAddress } from "@/lib/wallet";
import { ethers } from "ethers";

export default function SendPage() {
  const router = useRouter();
  const { wallet, network } = useWalletStore();
  const { sendTransaction, estimateGas, isLoading } = useTransaction();
  const { toUsd } = useEthPrice();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toError, setToError] = useState("");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    if (!wallet) router.push("/");
  }, [wallet, router]);

  useEffect(() => {
    if (ethers.isAddress(to) && amount && parseFloat(amount) > 0) {
      estimateGas(to, amount).then(setGasEstimate);
    } else {
      setGasEstimate(null);
    }
  }, [to, amount, estimateGas]);

  function validate(): boolean {
    let valid = true;

    if (!ethers.isAddress(to)) {
      setToError("Invalid Ethereum address");
      valid = false;
    } else {
      setToError("");
    }

    if (!amount || parseFloat(amount) <= 0) {
      setAmountError("Enter a valid amount");
      valid = false;
    } else {
      setAmountError("");
    }

    return valid;
  }

  function handleReview() {
    if (validate()) setShowConfirm(true);
  }

  async function handleConfirm() {
    setShowConfirm(false);
    const result = await sendTransaction({ to, amount, password });

    if (result) {
      toast.success("Transaction sent!", {
        description: `Hash: ${result.hash.slice(0, 10)}...`,
      });
    } else {
      toast.error("Transaction failed. Check your password and balance.");
    }
    router.push("/dashboard?refresh=1");
  }

  if (!wallet) return null;

  return (
    <main className="flex flex-col min-h-screen px-4 pb-8 pt-6 max-w-sm mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard?refresh=1")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Send ETH</h1>
      </div>

      <div className="flex flex-col gap-5">
        {/* To address */}
        <div className="flex flex-col gap-2">
          <Label>Recipient Address</Label>
          <Input
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`bg-card border-border h-12 rounded-xl font-mono text-sm ${toError ? "border-destructive" : ""}`}
          />
          {toError && <p className="text-xs text-destructive">{toError}</p>}
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <Label>Amount</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`bg-card border-border h-12 rounded-xl pr-14 ${amountError ? "border-destructive" : ""}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              ETH
            </span>
          </div>
          {amountError && <p className="text-xs text-destructive">{amountError}</p>}
        </div>

        {/* Gas estimate */}
        {gasEstimate && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border">
            <Fuel className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Estimated gas:</span>
            <div className="ml-auto flex flex-col items-end">
              <span className="text-sm font-mono">{parseFloat(gasEstimate).toFixed(8)} ETH</span>
              {toUsd(gasEstimate) && (
                <span className="text-xs text-muted-foreground">≈ {toUsd(gasEstimate)}</span>
              )}
            </div>
          </div>
        )}

        {/* Network warning */}
        {network === "mainnet" && (
          <div className="px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive font-medium">
              You are on Mainnet. This transaction uses real ETH.
            </p>
          </div>
        )}

        <Button
          onClick={handleReview}
          disabled={isLoading}
          size="lg"
          className="w-full h-12 rounded-xl font-semibold mt-2"
        >
          <Send className="w-4 h-4 mr-2" />
          Review Transaction
        </Button>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-card border-border rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              Review the details before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-secondary border border-border">
              <Row label="To" value={shortenAddress(to)} mono />
              <Row label="Amount" value={`${amount} ETH`} />
              {gasEstimate && (
                <Row
                  label="Gas (est.)"
                  value={`${parseFloat(gasEstimate).toFixed(8)} ETH${toUsd(gasEstimate) ? `  ≈ ${toUsd(gasEstimate)}` : ""}`}
                />
              )}
              <Row label="Network" value={network === "sepolia" ? "Sepolia Testnet" : "Ethereum Mainnet"} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Enter Password to Sign</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your wallet password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  className="bg-background border-border h-12 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-border bg-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleConfirm}
                disabled={isLoading || !password}
              >
                {isLoading ? "Sending..." : "Confirm & Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
