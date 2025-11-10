import { Hono } from "hono";
import type { Bindings } from "../types/bindings.js";

const health = new Hono<{ Bindings: Bindings }>();

health.get("/", (c) => {
  return c.json({
    service: "x402 Facilitator",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV,
  });
});

health.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default health;
