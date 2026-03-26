import { ethers } from "ethers";
import { NetworkType } from "@/types/wallet";

const ALCHEMY_SEPOLIA = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL!;
const ALCHEMY_MAINNET = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL!;

export function getProvider(network: NetworkType): ethers.JsonRpcProvider {
  const url = network === "sepolia" ? ALCHEMY_SEPOLIA : ALCHEMY_MAINNET;
  return new ethers.JsonRpcProvider(url);
}

export function getSigner(
  privateKey: string,
  network: NetworkType
): ethers.Wallet {
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
}
