export type NetworkType = "sepolia" | "mainnet";
export type LockTimeout = 1 | 5 | 15 | 30 | 60;

export interface IWallet {
  address: string;
  encryptedKey: string;
}

export interface ITransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  gasUsed?: string;
}

export interface ISettings {
  lockTimeout: LockTimeout;
  defaultNetwork: NetworkType;
}

export interface IWalletStore {
  wallet: IWallet | null;
  network: NetworkType;
  isLocked: boolean;
  transactions: ITransaction[];
  settings: ISettings;
  setWallet: (wallet: IWallet) => void;
  setNetwork: (network: NetworkType) => void;
  lock: () => void;
  unlock: () => void;
  addTransaction: (tx: ITransaction) => void;
  clearWallet: () => void;
  updateSettings: (settings: Partial<ISettings>) => void;
}
