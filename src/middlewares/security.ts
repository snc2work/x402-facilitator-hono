import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import type { Bindings } from "../types/bindings.js";

export const security = (): MiddlewareHandler => {
  return secureHeaders();
};

export const corsMiddleware = (): MiddlewareHandler<{ Bindings: Bindings }> => {
  return async (c, next) => {
    const allowedOrigins =
      c.env.NODE_ENV === "production"
        ? c.env.ALLOWED_ORIGINS?.split(",") || []
        : ["*"];

    return cors({
      origin: allowedOrigins,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    })(c, next);
  };
};
