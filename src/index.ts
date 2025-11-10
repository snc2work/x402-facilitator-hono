import { Hono } from "hono";
import { serve } from "@hono/node-server";
import app from "./app.js";

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = parseInt(process.env.PORT || "3002");
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}
