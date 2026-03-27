"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send, Download, Copy, RefreshCw, Lock, Settings,
  ExternalLink, CheckCircle, Clock, XCircle, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWalletStore } from "@/store/useWalletStore";
import { useBalance } from "@/hooks/useBalance";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useAutoLock } from "@/hooks/useAutoLock";
import { loadWalletFromStorage } from "@/lib/crypto";
import { shortenAddress } from "@/lib/wallet";
import { NetworkSwitcher } from "@/components/wallet/NetworkSwitcher";
import { ITransaction } from "@/types/wallet";

const ETHERSCAN_BASE: Record<string, string> = {
  sepolia: "https://sepolia.etherscan.io/tx/",
  mainnet: "https://etherscan.io/tx/",
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet, network, setWallet, lock } = useWalletStore();
  const { balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance(wallet?.address ?? null, network);
  const { transactions, isLoading: txLoading, refetch: refetchTx } = useTransactionHistory(wallet?.address ?? null, network);
  const { toUsd } = useEthPrice();
  useAutoLock();

  function refetch() {
    refetchBalance();
    refetchTx();
  }

  useEffect(() => {
    if (!wallet) {
      const stored = loadWalletFromStorage();
      if (stored) {
        setWallet(stored);
      } else {
        router.push("/");
      }
    }
  }, [wallet, router, setWallet]);

  useEffect(() => {
    if (searchParams.get("refresh") === "1") {
      refetchTx();
      router.replace("/dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!wallet) return null;

  function handleCopyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    toast.success("Address copied");
  }

  function handleLock() {
    lock();
    router.push("/");
  }

  return (
    <main className="flex flex-col min-h-screen px-4 pb-8 pt-6 max-w-sm mx-auto gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">SimpleCrypto</span>
        </div>
        <div className="flex items-center gap-2">
          <NetworkSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
            aria-label="Settings"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLock}
            aria-label="Lock wallet"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <Lock className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Balance card */}
      <div className="relative rounded-2xl bg-card border border-border p-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-4">
          {/* Address */}
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg bg-secondary border border-border hover:bg-muted transition-colors"
          >
            <span className="text-xs font-mono text-muted-foreground">
              {shortenAddress(wallet.address)}
            </span>
            <Copy className="w-3 h-3 text-muted-foreground" />
          </button>

          {/* Balance */}
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              {balanceLoading ? (
                <div className="w-32 h-10 rounded-lg bg-primary/10 animate-pulse" />
              ) : (
                <span className="text-4xl font-bold tracking-tight">{balance}</span>
              )}
              <span className="text-muted-foreground text-lg mb-0.5">ETH</span>
              <button onClick={refetch} className="mb-1 ml-1 text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading || txLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {toUsd(balance) && (
              <span className="text-sm text-muted-foreground">
                ≈ {toUsd(balance)}
              </span>
            )}
          </div>

          {/* Network badge */}
          <Badge
            variant="secondary"
            className={`w-fit text-xs ${network === "sepolia" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-green-400 bg-green-400/10 border-green-400/20"}`}
          >
            {network === "sepolia" ? "Sepolia Testnet" : "Ethereum Mainnet"}
          </Badge>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-14 rounded-xl flex flex-col gap-1 font-medium"
          onClick={() => router.push("/send")}
        >
          <Send className="w-5 h-5" />
          <span className="text-xs">Send</span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-xl flex flex-col gap-1 font-medium bg-card border-border hover:bg-secondary"
          onClick={() => router.push("/receive")}
        >
          <Download className="w-5 h-5" />
          <span className="text-xs">Receive</span>
        </Button>
      </div>

      <Separator className="bg-border" />

      {/* Transaction history */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Transactions
        </h3>

        {txLoading && transactions.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-12 h-3 rounded bg-secondary" />
                    <div className="w-20 h-2.5 rounded bg-secondary" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="w-16 h-3 rounded bg-secondary" />
                  <div className="w-10 h-2.5 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.hash} tx={tx} network={network} walletAddress={wallet.address} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TransactionRow({
  tx,
  network,
  walletAddress,
}: {
  tx: ITransaction;
  network: string;
  walletAddress: string;
}) {
  const isSent = tx.from.toLowerCase() === walletAddress.toLowerCase();
  const etherscanUrl = `${ETHERSCAN_BASE[network]}${tx.hash}`;

  const statusIcon = {
    confirmed: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
    pending: <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />,
    failed: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  }[tx.status];

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isSent ? "bg-destructive/15" : "bg-green-500/15"}`}>
          <Send className={`w-4 h-4 ${isSent ? "text-destructive" : "text-green-400 rotate-180"}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{isSent ? "Sent" : "Received"}</p>
          <p className="text-xs text-muted-foreground">
            {shortenAddress(isSent ? tx.to : tx.from)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isSent ? "text-destructive" : "text-green-400"}`}>
          {isSent ? "-" : "+"}{tx.value} ETH
        </span>
        <div className="flex items-center gap-1">
          {statusIcon}
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
