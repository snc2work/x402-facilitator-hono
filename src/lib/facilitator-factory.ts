import { Facilitator } from "./facilitator.js";
import { baseSepolia, base } from "viem/chains";
import type { Chain } from "viem";
import type { Bindings } from "../types/bindings.js";

const NETWORK_MAP: Record<string, Chain> = {
  base: base,
  "base-sepolia": baseSepolia,
};

const SVM_NETWORKS = ["solana-devnet", "solana"] as const;
type SvmNetwork = (typeof SVM_NETWORKS)[number];

export function createFacilitator(env: Bindings): Facilitator {
  const networkNames = (env.SUPPORTED_NETWORKS || "")
    .split(",")
    .map((n: string) => n.trim());

  const evmNetworks: Chain[] = networkNames
    .map((name: string) => NETWORK_MAP[name])
    .filter((chain: Chain | undefined): chain is Chain => chain !== undefined);

  const svmNetworks: SvmNetwork[] = networkNames.filter(
    (name: string): name is SvmNetwork =>
      SVM_NETWORKS.includes(name as SvmNetwork)
  );

  const svmRpcUrls: Record<string, string> = {};
  if (env.SOLANA_RPC_URL) {
    svmRpcUrls["solana"] = env.SOLANA_RPC_URL;
  }
  if (env.SOLANA_DEVNET_RPC_URL) {
    svmRpcUrls["solana-devnet"] = env.SOLANA_DEVNET_RPC_URL;
  }

  if (evmNetworks.length === 0 && svmNetworks.length === 0) {
    throw new Error(
      "At least one valid network (EVM or SVM) must be configured"
    );
  }

  return new Facilitator({
    evmPrivateKey: env.EVM_PRIVATE_KEY,
    svmPrivateKey: env.SVM_PRIVATE_KEY,
    evmNetworks,
    svmNetworks,
    svmRpcUrls,
  });
}
