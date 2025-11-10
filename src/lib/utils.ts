import type { Chain } from "viem";

/**
 * viemのChainオブジェクトからx402のネットワーク名に変換
 */
export function fromViemNameToX402Network(chain: Chain): string {
  const nameMap: Record<string, string> = {
    "Base Sepolia": "base-sepolia",
    Base: "base",
  };

  return nameMap[chain.name] || chain.name.toLowerCase().replace(/\s+/g, "-");
}
