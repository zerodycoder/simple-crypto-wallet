"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/useWalletStore";
import QRCode from "qrcode";

export default function ReceivePage() {
  const router = useRouter();
  const { wallet } = useWalletStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!wallet) {
      router.push("/");
      return;
    }
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, wallet.address, {
        width: 220,
        margin: 2,
        color: {
          dark: "#ffffff",
          light: "#1a1a2e",
        },
      });
    }
  }, [wallet, router]);

  function handleCopy() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    toast.success("Address copied to clipboard");
  }

  if (!wallet) return null;

  return (
    <main className="flex flex-col min-h-screen px-4 pb-8 pt-6 max-w-sm mx-auto gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Receive ETH</h1>
      </div>

      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-muted-foreground text-center">
          Share your address or QR code to receive ETH on this wallet.
        </p>

        {/* QR Code */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        {/* Address */}
        <div className="w-full flex flex-col gap-3">
          <div className="px-4 py-3 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Your Address</p>
            <p className="text-sm font-mono break-all leading-relaxed">{wallet.address}</p>
          </div>

          <Button
            onClick={handleCopy}
            size="lg"
            className="w-full h-12 rounded-xl font-semibold"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center px-4">
          Only send ETH or ERC-20 tokens to this address. Sending other assets may result in permanent loss.
        </p>
      </div>
    </main>
  );
}
