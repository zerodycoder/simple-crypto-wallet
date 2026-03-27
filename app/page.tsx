"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadWalletFromStorage } from "@/lib/crypto";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    if (loadWalletFromStorage()) {
      router.replace("/unlock");
    }
  }, [router]);
  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">SimpleCrypto</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your secure, extensible crypto wallet
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="w-full flex flex-col gap-3">
          {[
            {
              icon: ShieldCheck,
              title: "Non-custodial",
              desc: "Your keys, your crypto",
            },
            {
              icon: Zap,
              title: "Fast & lightweight",
              desc: "Built for speed and simplicity",
            },
            {
              icon: Wallet,
              title: "Extensible",
              desc: "Plugin-ready architecture",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-xl text-base font-semibold h-12"
            onClick={() => router.push("/create")}
          >
            Create New Wallet
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-xl text-base font-semibold h-12 border-border bg-card hover:bg-secondary"
            onClick={() => router.push("/import")}
          >
            Import Existing Wallet
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree that you are solely responsible for your private keys and funds.
        </p>
      </div>
    </main>
  );
}
