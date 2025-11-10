import type { ErrorHandler, NotFoundHandler } from "hono";
import type { Bindings } from "../types/bindings.js";

export const errorHandler: ErrorHandler<{ Bindings: Bindings }> = (err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message:
        c.env.NODE_ENV === "development" ? err.message : "An error occurred",
    },
    500
  );
};

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      error: "Not Found",
      message: "The requested endpoint does not exist",
    },
    404
  );
};
