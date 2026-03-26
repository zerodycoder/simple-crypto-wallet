import { act, renderHook } from "@testing-library/react";
import { useWalletStore } from "@/store/useWalletStore";
import { IWallet, ITransaction } from "@/types/wallet";

const mockWallet: IWallet = {
  address: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
  encryptedKey: '{"version":3,"address":"f39fd6e51aad88f6f4ce6ab8827279cfffb92266"}',
};

const mockTx: ITransaction = {
  hash: "0xabc123",
  from: "0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266",
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: "0.01",
  timestamp: Date.now(),
  status: "confirmed",
};

describe("useWalletStore", () => {
  beforeEach(() => {
    useWalletStore.setState({
      wallet: null,
      network: "sepolia",
      isLocked: true,
      transactions: [],
    });
  });

  it("initial state is correct", () => {
    const { result } = renderHook(() => useWalletStore());
    expect(result.current.wallet).toBeNull();
    expect(result.current.network).toBe("sepolia");
    expect(result.current.isLocked).toBe(true);
    expect(result.current.transactions).toHaveLength(0);
  });

  it("setWallet updates wallet and unlocks", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.setWallet(mockWallet));
    expect(result.current.wallet).toEqual(mockWallet);
    expect(result.current.isLocked).toBe(false);
  });

  it("lock sets isLocked to true", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.setWallet(mockWallet));
    act(() => result.current.lock());
    expect(result.current.isLocked).toBe(true);
  });

  it("unlock sets isLocked to false", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.unlock());
    expect(result.current.isLocked).toBe(false);
  });

  it("setNetwork changes the network", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.setNetwork("mainnet"));
    expect(result.current.network).toBe("mainnet");
  });

  it("addTransaction prepends to the list", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.addTransaction(mockTx));
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].hash).toBe("0xabc123");
  });

  it("addTransaction keeps newest first", () => {
    const { result } = renderHook(() => useWalletStore());
    const tx1 = { ...mockTx, hash: "0xfirst" };
    const tx2 = { ...mockTx, hash: "0xsecond" };
    act(() => result.current.addTransaction(tx1));
    act(() => result.current.addTransaction(tx2));
    expect(result.current.transactions[0].hash).toBe("0xsecond");
  });

  it("clearWallet resets state", () => {
    const { result } = renderHook(() => useWalletStore());
    act(() => result.current.setWallet(mockWallet));
    act(() => result.current.addTransaction(mockTx));
    act(() => result.current.clearWallet());
    expect(result.current.wallet).toBeNull();
    expect(result.current.isLocked).toBe(true);
    expect(result.current.transactions).toHaveLength(0);
  });
});
