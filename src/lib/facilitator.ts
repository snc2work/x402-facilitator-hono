import type { Chain } from "viem";
import { fromViemNameToX402Network } from "./utils.js";
import { verify as x402Verify, settle as x402Settle } from "x402/facilitator";
import { ZodError } from "zod";
import {
  PaymentRequirementsSchema,
  PaymentPayloadSchema,
  createConnectedClient,
  createSigner,
  isSvmSignerWallet,
  type VerifyResponse as X402VerifyResponse,
  type SettleResponse as X402SettleResponse,
} from "x402/types";
import type {
  SettleResult,
  VerifyResult,
  CreateFacilitatorOptions,
  SupportedKind,
  SupportedResponse,
  HttpResponse,
  HttpRequest,
} from "../types/facilitator.js";

export class Facilitator {
  private readonly evmPrivateKey: string;
  private readonly svmPrivateKey: string;
  private readonly svmRpcUrls: Record<string, string>;
  private readonly evmNetworkMap: Map<string, Chain>;
  private readonly svmNetworkSet: Set<string>;

  constructor(options: CreateFacilitatorOptions) {
    if (!options.evmPrivateKey && !options.svmPrivateKey) {
      throw new Error(
        "Facilitator: at least one private key (EVM or SVM) is required"
      );
    }
    const hasEvmNetworks =
      options.evmNetworks && options.evmNetworks.length > 0;
    const hasSvmNetworks =
      options.svmNetworks && options.svmNetworks.length > 0;
    if (!hasEvmNetworks && !hasSvmNetworks) {
      throw new Error(
        "Facilitator: at least one network (EVM or SVM) is required"
      );
    }

    this.evmPrivateKey = options.evmPrivateKey || "";
    this.svmPrivateKey = options.svmPrivateKey || "";
    this.svmRpcUrls = options.svmRpcUrls || {};

    this.evmNetworkMap = new Map(
      (options.evmNetworks || []).map((chain: Chain) => [
        fromViemNameToX402Network(chain),
        chain,
      ])
    );
    this.svmNetworkSet = new Set(options.svmNetworks || []);
  }

  private isEvmSupported(network: string): boolean {
    return this.evmNetworkMap.has(network);
  }

  private isSvmSupported(network: string): boolean {
    return this.svmNetworkSet.has(network) && !!this.svmPrivateKey;
  }

  public async listSupportedKinds(): Promise<SupportedResponse> {
    const kinds: SupportedKind[] = [];

    // EVM
    for (const networkName of this.evmNetworkMap.keys()) {
      kinds.push({
        x402Version: 1,
        scheme: "exact",
        network: networkName,
      });
    }

    // SVM
    for (const network of this.svmNetworkSet) {
      if (this.svmPrivateKey) {
        try {
          const signer = await createSigner(network, this.svmPrivateKey);
          const feePayer = isSvmSignerWallet(signer)
            ? signer.address
            : undefined;

          if (!feePayer) {
            console.warn(`No feePayer available for ${network}, skipping`);
            continue;
          }

          kinds.push({
            x402Version: 1,
            scheme: "exact",
            network,
            extra: {
              feePayer,
            },
          });
        } catch (error) {
          console.error(`Failed to create signer for ${network}:`, error);
        }
      }
    }

    return { kinds };
  }

  public async verifyPayment(
    paymentPayload: unknown,
    paymentRequirements: unknown
  ): Promise<VerifyResult> {
    const validatedRequirements =
      PaymentRequirementsSchema.parse(paymentRequirements);
    const validatedPayload = PaymentPayloadSchema.parse(paymentPayload);
    const { network: requestedNetwork } = validatedRequirements;

    let resp: X402VerifyResponse;

    if (this.isEvmSupported(requestedNetwork)) {
      const client = createConnectedClient(requestedNetwork);
      resp = await x402Verify(
        client,
        validatedPayload,
        validatedRequirements,
        undefined
      );
    } else if (this.isSvmSupported(requestedNetwork)) {
      const rpcUrl = this.svmRpcUrls[requestedNetwork];
      const x402Config = rpcUrl ? { svmConfig: { rpcUrl } } : undefined;
      const signer = await createSigner(requestedNetwork, this.svmPrivateKey);
      resp = await x402Verify(
        signer,
        validatedPayload,
        validatedRequirements,
        x402Config
      );
    } else {
      return { isValid: false };
    }

    return {
      isValid: resp.isValid,
      payer: resp.payer,
    };
  }

  public async settlePayment(
    paymentPayload: unknown,
    paymentRequirements: unknown
  ): Promise<SettleResult> {
    const validatedRequirements =
      PaymentRequirementsSchema.parse(paymentRequirements);
    const validatedPayload = PaymentPayloadSchema.parse(paymentPayload);
    const { network: requestedNetwork } = validatedRequirements;

    let resp: X402SettleResponse;

    if (this.isEvmSupported(requestedNetwork)) {
      const signer = await createSigner(requestedNetwork, this.evmPrivateKey);
      resp = await x402Settle(
        signer,
        validatedPayload,
        validatedRequirements,
        undefined
      );
    } else if (this.isSvmSupported(requestedNetwork)) {
      const rpcUrl = this.svmRpcUrls[requestedNetwork];
      const x402Config = rpcUrl ? { svmConfig: { rpcUrl } } : undefined;
      const signer = await createSigner(requestedNetwork, this.svmPrivateKey);
      resp = await x402Settle(
        signer,
        validatedPayload,
        validatedRequirements,
        x402Config
      );
    } else {
      return {
        success: false,
        transaction: "",
        network: requestedNetwork,
        errorReason: "Network not supported by this facilitator",
      };
    }

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
      const supportedKinds = await this.listSupportedKinds();
      return {
        status: 200,
        body: supportedKinds,
      };
    }

    if (method === "POST" && path === "/verify") {
      try {
        const result = await this.verifyPayment(
          body?.paymentPayload,
          body?.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            status: 400,
            body: {
              error: "Validation error",
              message: "Invalid payment payload or requirements",
              details: error.issues,
            },
          };
        }
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
        const result = await this.settlePayment(
          body?.paymentPayload,
          body?.paymentRequirements
        );

        return {
          status: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          return {
            status: 400,
            body: {
              error: "Validation error",
              message: "Invalid payment payload or requirements",
              details: error.issues,
            },
          };
        }
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
