import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Bindings } from "./types/bindings.js";
import { security, corsMiddleware } from "./middlewares/security.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import routes from "./routes/index.js";
import { TopPage } from "./views/TopPage.js";
import { serve } from "@hono/node-server";

const app = new Hono<{ Bindings: Bindings }>();

if (process.env.NODE_ENV !== "production") {
  app.use("/*", serveStatic({ root: "./public" }));
}

app.use("*", security());
app.use("*", corsMiddleware());
app.use("*", logger());
app.use("*", prettyJSON());

app.get("/", (c) => {
  return c.html(<TopPage />);
});

app.route("/", routes);

app.notFound(notFoundHandler);
app.onError(errorHandler);

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = parseInt(process.env.PORT || "3002");
  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}
