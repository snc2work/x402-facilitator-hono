import { config } from "dotenv";
import { baseSepolia, base, sepolia, mainnet } from "viem/chains";
import type { Chain } from "viem";

config();

// 環境変数の検証
if (!process.env.EVM_PRIVATE_KEY) {
  throw new Error("EVM_PRIVATE_KEY is required in .env file");
}

// ネットワーク名とviemのChainオブジェクトのマッピング
const NETWORK_MAP: Record<string, Chain> = {
  "base-sepolia": baseSepolia,
  base: base,
  sepolia: sepolia,
  mainnet: mainnet,
};

// サポートするネットワークを環境変数から取得
function getSupportedNetworks(): Chain[] {
  const networksStr = process.env.SUPPORTED_NETWORKS || "base-sepolia";
  const networkNames = networksStr.split(",").map((n) => n.trim());

  const networks: Chain[] = [];
  for (const name of networkNames) {
    const chain = NETWORK_MAP[name];
    if (!chain) {
      console.warn(`Unknown network: ${name}, skipping...`);
      continue;
    }
    networks.push(chain);
  }

  if (networks.length === 0) {
    throw new Error("At least one valid network must be configured");
  }

  return networks;
}

export const appConfig = {
  evmPrivateKey: process.env.EVM_PRIVATE_KEY,
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  networks: getSupportedNetworks(),
  minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "1", 10),
} as const;

// 開発環境での設定表示
if (appConfig.nodeEnv === "development") {
  console.log("Configuration loaded:");
  console.log(`- Port: ${appConfig.port}`);
  console.log(
    `- Networks: ${appConfig.networks.map((n) => n.name).join(", ")}`
  );
  console.log(`- Min Confirmations: ${appConfig.minConfirmations}`);
}
