import { Hono } from "hono";
import { ZodError } from "zod";
import type { Bindings } from "../types/bindings.js";
import { createFacilitator } from "../lib/facilitator-factory.js";
import dotenv from "dotenv";

dotenv.config();
const facilitatorInstance = createFacilitator(process.env as any);

const facilitatorRouter = new Hono<{ Bindings: Bindings }>();

// GET /supported
facilitatorRouter.get("/supported", async (c) => {
  const kinds = await facilitatorInstance.listSupportedKinds();
  return c.json(kinds);
});

// GET /verify
facilitatorRouter.get("/verify", (c) => {
  return c.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

// POST /verify
facilitatorRouter.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const result = await facilitatorInstance.verifyPayment(
      body.paymentPayload,
      body.paymentRequirements
    );

    return c.json(result);
  } catch (error) {
    console.error("Verify error:", error);

    if (error instanceof ZodError) {
      return c.json(
        {
          error: "Validation error",
          message: "Invalid payment payload or requirements",
          details: error.issues,
        },
        400
      );
    }

    return c.json(
      {
        error: "Verification failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

// GET /settle
facilitatorRouter.get("/settle", (c) => {
  return c.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

// POST /settle
facilitatorRouter.post("/settle", async (c) => {
  try {
    const body = await c.req.json();
    const result = await facilitatorInstance.settlePayment(
      body.paymentPayload,
      body.paymentRequirements
    );

    return c.json(result);
  } catch (error) {
    console.error("Settle error:", error);

    if (error instanceof ZodError) {
      return c.json(
        {
          error: "Validation error",
          message: "Invalid payment payload or requirements",
          details: error.issues,
        },
        400
      );
    }

    return c.json(
      {
        error: "Settlement failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

export default facilitatorRouter;
