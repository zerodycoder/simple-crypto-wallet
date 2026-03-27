"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { importWalletFromMnemonic, importWalletFromPrivateKey } from "@/lib/wallet";
import { saveWalletToStorage } from "@/lib/crypto";
import { useWalletStore } from "@/store/useWalletStore";

export default function ImportWalletPage() {
  const router = useRouter();
  const { setWallet } = useWalletStore();

  const [mnemonic, setMnemonic] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleImport(type: "mnemonic" | "privateKey") {
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
      const wallet =
        type === "mnemonic"
          ? await importWalletFromMnemonic(mnemonic, password)
          : await importWalletFromPrivateKey(privateKey, password);

      saveWalletToStorage(wallet.address, wallet.encryptedKey);
      setWallet(wallet);
      toast.success("Wallet imported successfully!");
      router.push("/dashboard");
    } catch {
      toast.error("Invalid phrase or key. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <h2 className="text-2xl font-bold">Import Wallet</h2>
          <p className="text-muted-foreground text-sm">
            Restore your wallet using a seed phrase or private key.
          </p>
        </div>

        <Tabs defaultValue="mnemonic" className="w-full">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="mnemonic" className="flex-1">Seed Phrase</TabsTrigger>
            <TabsTrigger value="privateKey" className="flex-1">Private Key</TabsTrigger>
          </TabsList>

          <TabsContent value="mnemonic" className="mt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>12-Word Seed Phrase</Label>
                <textarea
                  placeholder="Enter your 12 words separated by spaces..."
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <PasswordFields
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirmPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              <Button
                onClick={() => handleImport("mnemonic")}
                disabled={isLoading || !mnemonic.trim()}
                size="lg"
                className="w-full h-12 rounded-xl font-semibold mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                ) : "Import Wallet"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privateKey" className="mt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Private Key</Label>
                <Input
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-card border-border h-12 rounded-xl font-mono text-sm"
                />
              </div>

              <PasswordFields
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirmPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
              />

              <Button
                onClick={() => handleImport("privateKey")}
                disabled={isLoading || !privateKey.trim()}
                size="lg"
                className="w-full h-12 rounded-xl font-semibold mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                ) : "Import Wallet"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

interface IPasswordFieldsProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onToggleShow: () => void;
}

function PasswordFields({
  password,
  confirmPassword,
  showPassword,
  onPasswordChange,
  onConfirmChange,
  onToggleShow,
}: IPasswordFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>New Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="pr-10 bg-card border-border h-12 rounded-xl"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Confirm Password</Label>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          className="bg-card border-border h-12 rounded-xl"
        />
      </div>
    </>
  );
}
