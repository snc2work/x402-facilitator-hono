import { describe, it, expect } from "vitest";
import app from "../src/app";

const mockEnv = {
  EVM_PRIVATE_KEY:
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  SVM_PRIVATE_KEY: "",
  NODE_ENV: "test",
  SUPPORTED_NETWORKS: "base-sepolia",
  MIN_CONFIRMATIONS: "1",
};

describe("X402 Facilitator API", () => {
  const testRequest = (path: string, options?: RequestInit, env = mockEnv) => {
    return app.request(path, options, env);
  };

  describe("GET /", () => {
    it("should return the HTML top page", async () => {
      const res = await testRequest("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
      const text = await res.text();
      expect(text).toContain("<title>x402 Facilitator</title>");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await testRequest("/health");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("status", "ok");
    });
  });

  describe("GET /supported", () => {
    it("should return supported payment kinds for EVM", async () => {
      const res = await testRequest("/supported");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("kinds");
    });
  });

  describe("POST /verify", () => {
    it("should return 400 for missing payload", async () => {
      const res = await testRequest("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid JSON", async () => {
      const res = await testRequest("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      expect(res.status).toBe(400);
    });

    it("should handle EVM network verification request", async () => {
      const res = await testRequest("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            network: "base-sepolia",
            transactionHash: "0x123...",
          },
          paymentRequirements: {
            network: "base-sepolia",
            recipient: "0xabc...",
            amount: "1000000000000000000",
          },
        }),
      });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe("POST /settle", () => {
    it("should return 400 for missing payload", async () => {
      const res = await testRequest("/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should handle EVM network settle request", async () => {
      const res = await testRequest("/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: {
            network: "base-sepolia",
            transactionHash: "0x123...",
          },
          paymentRequirements: {
            network: "base-sepolia",
            recipient: "0xabc...",
            amount: "1000000000000000000",
          },
        }),
      });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await testRequest("/unknown-route");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toHaveProperty("error", "Not Found");
    });
  });
});
