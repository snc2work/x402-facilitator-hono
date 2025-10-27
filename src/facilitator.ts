import type { Chain } from "viem";
import { fromViemNameToX402Network } from "./utils";

import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";

import {
  createConnectedClient,
  createSigner,
  SupportedEVMNetworks,
} from "x402/types";

import type {
  PaymentPayload as X402PaymentPayload,
  PaymentRequirements as X402PaymentRequirements,
  VerifyResponse as X402VerifyResponse,
  SettleResponse as X402SettleResponse,
} from "x402/types";

export interface SettleResult {
  success: boolean;
  errorReason?: string;
  transaction: string;
  network: string;
  payer?: string;
}

export interface PaymentPayload {
  [key: string]: any;
}

export interface PaymentRequirements {
  network: string;
  [key: string]: any;
}

export interface VerifyResult {
  isValid: boolean;
  payer?: string;
}

export interface CreateFacilitatorOptions {
  evmPrivateKey: string;
  networks: Chain[];
  minConfirmations?: number;
}

export const DEFAULT_MIN_CONFIRMATIONS = 1;

export interface SupportedKind {
  x402Version: number;
  scheme: "exact";
  network: string;
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

export class Facilitator {
  private readonly evmPrivateKey: string;
  private readonly networks: Chain[];
  private readonly minConfirmations: number;

  constructor(options: CreateFacilitatorOptions) {
    if (!options.evmPrivateKey) {
      throw new Error("Facilitator: evmPrivateKey is required");
    }
    if (!options.networks || options.networks.length === 0) {
      throw new Error("Facilitator: at least one EVM network is required");
    }

    this.evmPrivateKey = options.evmPrivateKey;
    this.networks = options.networks;
    this.minConfirmations =
      options.minConfirmations ?? DEFAULT_MIN_CONFIRMATIONS;
  }

  public listSupportedKinds(): SupportedResponse {
    const kinds: SupportedKind[] = this.networks.map((chain) => ({
      x402Version: 1,
      scheme: "exact",
      network: fromViemNameToX402Network(chain),
    }));

    return { kinds };
  }

  public async verifyPayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<VerifyResult> {
    const requestedNetwork = paymentRequirements.network;

    const locallySupported = this.networks.some(
      (chain) => fromViemNameToX402Network(chain) === requestedNetwork
    );
    if (!locallySupported) {
      return { isValid: false };
    }

    if (!SupportedEVMNetworks.includes(requestedNetwork as any)) {
      return { isValid: false };
    }

    const client = createConnectedClient(requestedNetwork);

    const resp: X402VerifyResponse = await x402Verify(
      client,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    return {
      isValid: resp.isValid,
      payer: resp.payer,
    };
  }

  public async settlePayment(
    paymentPayload: PaymentPayload,
    paymentRequirements: PaymentRequirements
  ): Promise<SettleResult> {
    const requestedNetwork = paymentRequirements.network;

    const locallySupported = this.networks.some(
      (chain) => fromViemNameToX402Network(chain) === requestedNetwork
    );
    if (!locallySupported) {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
      };
    }

    if (!SupportedEVMNetworks.includes(requestedNetwork as any)) {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
      };
    }

    const signer = await createSigner(requestedNetwork, this.evmPrivateKey);

    const resp: X402SettleResponse = await x402Settle(
      signer,
      paymentPayload as X402PaymentPayload,
      paymentRequirements as X402PaymentRequirements,
      undefined
    );

    return {
      success: resp.success,
      errorReason: resp.errorReason,
      transaction: resp.transaction,
      network: resp.network,
      payer: resp.payer,
    };
  }

  public async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const { method, path, body } = request;

    if (method === "GET" && path === "/supported") {
      return {
        status: 200,
        body: this.listSupportedKinds(),
      };
    }

    if (method === "POST" && path === "/verify") {
      try {
        if (!body?.paymentPayload || !body?.paymentRequirements) {
          return {
            status: 400,
            body: { error: "Missing paymentPayload or paymentRequirements" },
          };
        }

        const result = await this.verifyPayment(
          body.paymentPayload,
          body.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        return {
          status: 400,
          body: {
            error: "Failed to verify payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    if (method === "POST" && path === "/settle") {
      try {
        if (!body?.paymentPayload || !body?.paymentRequirements) {
          return {
            status: 400,
            body: { error: "Missing paymentPayload or paymentRequirements" },
          };
        }

        const result = await this.settlePayment(
          body.paymentPayload,
          body.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        return {
          status: 400,
          body: {
            error: "Failed to settle payment",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }

    return {
      status: 404,
      body: { error: "Not found" },
    };
  }
}
