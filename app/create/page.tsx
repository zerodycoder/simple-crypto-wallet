"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Copy, Check, ArrowLeft, ArrowRight, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createNewWallet } from "@/lib/wallet";
import { saveWalletToStorage } from "@/lib/crypto";
import { useWalletStore } from "@/store/useWalletStore";

type Step = "password" | "mnemonic" | "verify";

export default function CreateWalletPage() {
  const router = useRouter();
  const { setWallet } = useWalletStore();

  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [walletData, setWalletData] = useState<{ address: string; encryptedKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyWords, setVerifyWords] = useState<string[]>(["", "", ""]);
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mnemonicWords = mnemonic.split(" ");

  async function handlePasswordSubmit() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { wallet, mnemonic: phrase } = await createNewWallet(password);
      setMnemonic(phrase);
      setWalletData(wallet);

      // Pick 3 random word indices for verification
      const indices: number[] = [];
      while (indices.length < 3) {
        const idx = Math.floor(Math.random() * 12);
        if (!indices.includes(idx)) indices.push(idx);
      }
      setVerifyIndices(indices.sort((a, b) => a - b));
      setStep("mnemonic");
    } catch {
      toast.error("Failed to create wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyMnemonic() {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Seed phrase copied");
  }

  function handleVerifySubmit() {
    const allCorrect = verifyIndices.every(
      (idx, i) => verifyWords[i].trim().toLowerCase() === mnemonicWords[idx].toLowerCase()
    );

    if (!allCorrect) {
      toast.error("Words do not match. Please check your seed phrase.");
      return;
    }

    if (!walletData) return;

    saveWalletToStorage(walletData.address, walletData.encryptedKey);
    setWallet(walletData);
    toast.success("Wallet created successfully!");
    router.push("/dashboard");
  }

  const steps = ["Set Password", "Save Phrase", "Verify"];
  const stepIndex = { password: 0, mnemonic: 1, verify: 2 }[step];

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => (step === "password" ? router.push("/") : setStep(step === "verify" ? "mnemonic" : "password"))}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px w-8 transition-colors ${i < stepIndex ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step: Password */}
        {step === "password" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold">Create Password</h2>
              <p className="text-muted-foreground text-sm mt-1">
                This password encrypts your wallet on this device.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 bg-card border-border h-12 rounded-xl"
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  className="bg-card border-border h-12 rounded-xl"
                />
              </div>
            </div>

            <Button
              onClick={handlePasswordSubmit}
              disabled={isLoading}
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating wallet...</>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step: Mnemonic */}
        {step === "mnemonic" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold">Save Seed Phrase</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Write these 12 words in order. This is the only way to recover your wallet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                Never share your seed phrase with anyone. SimpleCrypto will never ask for it.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {mnemonicWords.map((word, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border"
                >
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm font-medium font-mono">{word}</span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleCopyMnemonic}
              className="w-full rounded-xl border-border bg-card h-11"
            >
              {copied ? (
                <><Check className="w-4 h-4 mr-2 text-primary" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> Copy to clipboard</>
              )}
            </Button>

            <Button
              onClick={() => setStep("verify")}
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
            >
              I have saved my phrase <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step: Verify */}
        {step === "verify" && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold">Verify Phrase</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter the correct words to confirm you saved your seed phrase.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {verifyIndices.map((wordIndex, i) => (
                <div key={wordIndex} className="flex flex-col gap-2">
                  <Label>Word #{wordIndex + 1}</Label>
                  <Input
                    placeholder={`Enter word #${wordIndex + 1}`}
                    value={verifyWords[i]}
                    onChange={(e) => {
                      const updated = [...verifyWords];
                      updated[i] = e.target.value;
                      setVerifyWords(updated);
                    }}
                    className="bg-card border-border h-12 rounded-xl font-mono"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleVerifySubmit}
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
            >
              Create Wallet
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
