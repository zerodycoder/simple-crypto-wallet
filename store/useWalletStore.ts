import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IWallet, ITransaction, NetworkType, IWalletStore, ISettings } from "@/types/wallet";

const DEFAULT_SETTINGS: ISettings = {
  lockTimeout: 5,
  defaultNetwork: "sepolia",
};

export const useWalletStore = create<IWalletStore>()(
  persist(
    (set) => ({
      wallet: null,
      network: "sepolia",
      isLocked: true,
      transactions: [],
      settings: DEFAULT_SETTINGS,

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

      updateSettings: (partial: Partial<ISettings>) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
    }),
    {
      name: "scw_store",
      partialize: (state) => ({
        settings: state.settings,
        network: state.network,
      }),
    }
  )
);
