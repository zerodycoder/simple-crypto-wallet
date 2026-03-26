import { ethers } from "ethers";

const STORAGE_KEY = "scw_wallet";

export async function encryptPrivateKey(
  privateKey: string,
  password: string
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  const encrypted = await wallet.encrypt(password);
  return encrypted;
}

export async function decryptPrivateKey(
  encryptedJson: string,
  password: string
): Promise<string> {
  const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
  return wallet.privateKey;
}

export function saveWalletToStorage(address: string, encryptedKey: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ address, encryptedKey })
  );
}

export function loadWalletFromStorage(): {
  address: string;
  encryptedKey: string;
} | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeWalletFromStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
