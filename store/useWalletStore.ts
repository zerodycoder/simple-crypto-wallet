import { create } from "zustand";
import { IWallet, ITransaction, NetworkType, IWalletStore } from "@/types/wallet";

export const useWalletStore = create<IWalletStore>((set) => ({
  wallet: null,
  network: "sepolia",
  isLocked: true,
  transactions: [],

  setWallet: (wallet: IWallet) =>
    set({ wallet, isLocked: false }),

  setNetwork: (network: NetworkType) =>
    set({ network }),

  lock: () =>
    set({ isLocked: true }),

  unlock: () =>
    set({ isLocked: false }),

  addTransaction: (tx: ITransaction) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),

  clearWallet: () =>
    set({ wallet: null, isLocked: true, transactions: [] }),
}));
