import { ethers } from "ethers";
import { encryptPrivateKey } from "./crypto";
import { IWallet } from "@/types/wallet";

export async function createNewWallet(password: string): Promise<{
  wallet: IWallet;
  mnemonic: string;
}> {
  const randomWallet = ethers.Wallet.createRandom();
  const mnemonic = randomWallet.mnemonic!.phrase;
  const encryptedKey = await encryptPrivateKey(randomWallet.privateKey, password);

  return {
    wallet: {
      address: randomWallet.address,
      encryptedKey,
    },
    mnemonic,
  };
}

export async function importWalletFromMnemonic(
  mnemonic: string,
  password: string
): Promise<IWallet> {
  const importedWallet = ethers.Wallet.fromPhrase(mnemonic.trim());
  const encryptedKey = await encryptPrivateKey(importedWallet.privateKey, password);

  return {
    address: importedWallet.address,
    encryptedKey,
  };
}

export async function importWalletFromPrivateKey(
  privateKey: string,
  password: string
): Promise<IWallet> {
  const importedWallet = new ethers.Wallet(privateKey.trim());
  const encryptedKey = await encryptPrivateKey(importedWallet.privateKey, password);

  return {
    address: importedWallet.address,
    encryptedKey,
  };
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value: bigint, decimals = 6): string {
  return parseFloat(ethers.formatEther(value)).toFixed(decimals);
}
