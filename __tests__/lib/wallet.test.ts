/**
 * @jest-environment node
 */
import { shortenAddress, formatEth, createNewWallet, importWalletFromMnemonic, importWalletFromPrivateKey } from "@/lib/wallet";
import { ethers } from "ethers";

describe("shortenAddress", () => {
  it("shortens a valid address to 6...4 format", () => {
    const address = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortenAddress(address)).toBe("0x1234...5678");
  });

  it("preserves the 0x prefix", () => {
    const address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    expect(shortenAddress(address)).toMatch(/^0x/);
  });
});

describe("formatEth", () => {
  it("formats 1 ETH (in wei) correctly", () => {
    const oneEth = ethers.parseEther("1");
    expect(formatEth(oneEth)).toBe("1.000000");
  });

  it("formats 0 ETH correctly", () => {
    expect(formatEth(0n)).toBe("0.000000");
  });

  it("formats fractional ETH correctly", () => {
    const half = ethers.parseEther("0.5");
    expect(formatEth(half)).toBe("0.500000");
  });

  it("respects custom decimal places", () => {
    const oneEth = ethers.parseEther("1");
    expect(formatEth(oneEth, 2)).toBe("1.00");
  });
});

describe("createNewWallet", () => {
  it("creates a wallet with a valid Ethereum address", async () => {
    const { wallet } = await createNewWallet("password123");
    expect(ethers.isAddress(wallet.address)).toBe(true);
  });

  it("returns a 12-word mnemonic phrase", async () => {
    const { mnemonic } = await createNewWallet("password123");
    expect(mnemonic.split(" ")).toHaveLength(12);
  });

  it("returns an encrypted key that is a valid JSON string", async () => {
    const { wallet } = await createNewWallet("password123");
    expect(() => JSON.parse(wallet.encryptedKey)).not.toThrow();
  });

  it("two wallets created independently have different addresses", async () => {
    const { wallet: w1 } = await createNewWallet("password123");
    const { wallet: w2 } = await createNewWallet("password123");
    expect(w1.address).not.toBe(w2.address);
  });
}, 30000);

describe("importWalletFromMnemonic", () => {
  const testMnemonic = "test test test test test test test test test test test junk";

  it("imports a wallet from a known mnemonic with correct address", async () => {
    const wallet = await importWalletFromMnemonic(testMnemonic, "password123");
    expect(ethers.isAddress(wallet.address)).toBe(true);
  });

  it("same mnemonic always produces the same address", async () => {
    const w1 = await importWalletFromMnemonic(testMnemonic, "pass1");
    const w2 = await importWalletFromMnemonic(testMnemonic, "pass2");
    expect(w1.address).toBe(w2.address);
  });

  it("trims whitespace from mnemonic input", async () => {
    const w1 = await importWalletFromMnemonic(testMnemonic, "pass");
    const w2 = await importWalletFromMnemonic(`  ${testMnemonic}  `, "pass");
    expect(w1.address).toBe(w2.address);
  });

  it("throws on invalid mnemonic", async () => {
    await expect(
      importWalletFromMnemonic("invalid mnemonic phrase", "pass")
    ).rejects.toThrow();
  });
}, 30000);

describe("importWalletFromPrivateKey", () => {
  const testPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  it("imports a wallet from a valid private key", async () => {
    const wallet = await importWalletFromPrivateKey(testPrivateKey, "password123");
    expect(ethers.isAddress(wallet.address)).toBe(true);
  });

  it("produces the correct address for a known private key", async () => {
    const wallet = await importWalletFromPrivateKey(testPrivateKey, "password123");
    // This is the known address for the Hardhat default account #0
    expect(wallet.address.toLowerCase()).toBe("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  });

  it("throws on invalid private key", async () => {
    await expect(
      importWalletFromPrivateKey("0xinvalidkey", "pass")
    ).rejects.toThrow();
  });
}, 30000);
