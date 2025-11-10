import { serve } from "@hono/node-server";
import app from "./app.js";

// Vercel
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || "3002");
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
