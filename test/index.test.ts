import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("Security Headers", () => {
  it("should include security headers", async () => {
    const res = await app.request("/");

    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBeTruthy();
    expect(res.headers.get("referrer-policy")).toBeTruthy();
  });
});

describe("X402 Facilitator API", () => {
  describe("GET /", () => {
    it("should return service information", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("service", "x402 Facilitator");
      expect(json).toHaveProperty("status", "healthy");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("status", "ok");
      expect(json).toHaveProperty("uptime");
    });
  });

  describe("GET /facilitator/supported", () => {
    it("should return supported payment kinds", async () => {
      const res = await app.request("/facilitator/supported");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("kinds");
      expect(Array.isArray(json.kinds)).toBe(true);
      expect(json.kinds.length).toBeGreaterThan(0);

      const firstKind = json.kinds[0];
      expect(firstKind).toHaveProperty("x402Version", 1);
      expect(firstKind).toHaveProperty("scheme", "exact");
      expect(firstKind).toHaveProperty("network");
    });
  });

  describe("POST /facilitator/verify", () => {
    it("should return 400 for missing payload", async () => {
      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 for invalid JSON", async () => {
      const res = await app.request("/facilitator/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /facilitator/settle", () => {
    it("should return 400 for missing payload", async () => {
      const res = await app.request("/facilitator/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await app.request("/unknown-route");
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json).toHaveProperty("error", "Not Found");
    });
  });
});
