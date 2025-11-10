import type { Chain } from "viem";

export interface SettleResult {
  success: boolean;
  errorReason?: string;
  transaction: string;
  network: string;
  payer?: string;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
}

export interface CreateFacilitatorOptions {
  evmPrivateKey?: string;
  svmPrivateKey?: string;
  evmNetworks?: Chain[];
  svmNetworks?: string[];
  svmRpcUrls?: Record<string, string>;
}

export interface SupportedKind {
  x402Version: number;
  scheme: string;
  network: string;
  extra?: {
    feePayer?: string;
  };
}

export interface SupportedResponse {
  kinds: SupportedKind[];
}

export interface HttpResponse {
  status: number;
  body: any;
}

export interface HttpRequest {
  method: string;
  path: string;
  body?: any;
}
