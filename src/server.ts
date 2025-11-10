import { serve } from "@hono/node-server";
import app from "./app.js";

const port = parseInt(process.env.PORT || "3002");

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
