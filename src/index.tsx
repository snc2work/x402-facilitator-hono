import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { FC } from "hono/jsx";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Bindings } from "./types/bindings.js";
import { security, corsMiddleware } from "./middlewares/security.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import routes from "./routes/index.js";
import { serve } from "@hono/node-server";

// TopPageを直接定義（FC型でJSXエラー回避）
const TopPage: FC = () => {
  return (
    <html>
      <head>
        <title>X402 Facilitator</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div className="bg-blue-500 text-white p-4">
          <h1>Hello from TopPage!</h1>
          <p>Your app content here...</p>
        </div>
      </body>
    </html>
  );
};

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
