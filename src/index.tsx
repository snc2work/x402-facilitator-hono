import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { FC, PropsWithChildren } from "hono/jsx";
import type { Bindings } from "./types/bindings.js";
import { security, corsMiddleware } from "./middlewares/security.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import routes from "./routes/index.js";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";

// Layout
const Layout: FC<PropsWithChildren<{ title: string }>> = (props) => {
  return (
    <html lang="ja" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title}</title>
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>{props.children}</body>
    </html>
  );
};

// EndpointItem
const EndpointItem: FC<{
  method: string;
  path: string;
  description: string;
}> = ({ method, path, description }) => {
  const isGet = method === "GET";
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
      <div className="flex items-center gap-4">
        <span
          className={`w-16 text-center text-xs font-bold px-2.5 py-1 rounded-full ${
            isGet
              ? "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          }`}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
          {path}
        </code>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        {description}
      </p>
    </div>
  );
};

// TopPage
const TopPage: FC = () => {
  const endpoints = [
    {
      method: "GET",
      path: "/health",
      description: "",
    },
    {
      method: "GET",
      path: "/supported",
      description: "",
    },
    {
      method: "GET",
      path: "/verify",
      description: "",
    },
    {
      method: "POST",
      path: "/verify",
      description: "",
    },
    {
      method: "GET",
      path: "/settle",
      description: "",
    },
    {
      method: "POST",
      path: "/settle",
      description: "",
    },
  ];

  return (
    <Layout title="x402 Facilitator">
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <header className="mb-10">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">
              x402 Facilitator
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              This x402 Facilitator is built with Hono.
            </p>
          </header>

          <main>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
              Available Endpoints
            </h2>
            <div className="space-y-4 text-left">
              {endpoints.map((endpoint) => (
                <EndpointItem
                  key={`${endpoint.method}-${endpoint.path}`}
                  method={endpoint.method}
                  path={endpoint.path}
                  description={endpoint.description}
                />
              ))}
            </div>
          </main>

          <footer className="mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check API health and view supported chains.
            </p>
            <div className="flex justify-center items-center gap-4">
              <a
                href="/health"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Health Check
              </a>
              <a
                href="/supported"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Supported Chains
              </a>
            </div>
          </footer>
        </div>
      </div>
    </Layout>
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
