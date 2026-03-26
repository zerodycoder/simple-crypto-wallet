/**
 * @jest-environment node
 */
import { encryptPrivateKey, decryptPrivateKey, saveWalletToStorage, loadWalletFromStorage, removeWalletFromStorage } from "@/lib/crypto";

const TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_PASSWORD = "securePassword123";

describe("encryptPrivateKey / decryptPrivateKey", () => {
  it("encrypts and decrypts back to the original private key", async () => {
    const encrypted = await encryptPrivateKey(TEST_PRIVATE_KEY, TEST_PASSWORD);
    const decrypted = await decryptPrivateKey(encrypted, TEST_PASSWORD);
    expect(decrypted.toLowerCase()).toBe(TEST_PRIVATE_KEY.toLowerCase());
  });

  it("encrypted output is a valid JSON keystore string", async () => {
    const encrypted = await encryptPrivateKey(TEST_PRIVATE_KEY, TEST_PASSWORD);
    const parsed = JSON.parse(encrypted);
    expect(parsed).toHaveProperty("address");
    // ethers.js keystore v3 uses capital "Crypto"
    expect(parsed).toHaveProperty("Crypto");
  });

  it("throws when decrypting with wrong password", async () => {
    const encrypted = await encryptPrivateKey(TEST_PRIVATE_KEY, TEST_PASSWORD);
    await expect(
      decryptPrivateKey(encrypted, "wrongPassword")
    ).rejects.toThrow();
  });

  it("same key encrypted twice produces different ciphertext (random IV)", async () => {
    const enc1 = await encryptPrivateKey(TEST_PRIVATE_KEY, TEST_PASSWORD);
    const enc2 = await encryptPrivateKey(TEST_PRIVATE_KEY, TEST_PASSWORD);
    expect(enc1).not.toBe(enc2);
  });
}, 30000);

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("localStorage wallet storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads wallet data correctly", () => {
    saveWalletToStorage("0xTestAddress", "encryptedKeyData");
    const loaded = loadWalletFromStorage();
    expect(loaded).toEqual({
      address: "0xTestAddress",
      encryptedKey: "encryptedKeyData",
    });
  });

  it("returns null when nothing is stored", () => {
    expect(loadWalletFromStorage()).toBeNull();
  });

  it("removes wallet from storage", () => {
    saveWalletToStorage("0xTestAddress", "encryptedKeyData");
    removeWalletFromStorage();
    expect(loadWalletFromStorage()).toBeNull();
  });

  it("overwrites previous wallet when saving again", () => {
    saveWalletToStorage("0xOldAddress", "oldKey");
    saveWalletToStorage("0xNewAddress", "newKey");
    const loaded = loadWalletFromStorage();
    expect(loaded?.address).toBe("0xNewAddress");
  });
});
