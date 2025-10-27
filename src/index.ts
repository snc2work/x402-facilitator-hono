import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { appConfig } from "./config";
import { Facilitator } from "./facilitator";

const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// Facilitatorインスタンスの作成
const facilitator = new Facilitator({
  evmPrivateKey: appConfig.evmPrivateKey,
  networks: appConfig.networks,
  minConfirmations: appConfig.minConfirmations,
});

// ヘルスチェックエンドポイント
app.get("/", (c) => {
  return c.json({
    service: "x402 Facilitator",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// Facilitatorエンドポイント
// GET /facilitator/supported - サポートされている支払い方法を取得
app.get("/facilitator/supported", async (c) => {
  const response = await facilitator.handleRequest({
    method: "GET",
    path: "/supported",
  });
  return c.json(response.body, response.status as any); // 修正: as any を追加
});

// POST /facilitator/verify - 支払いを検証
app.post("/facilitator/verify", async (c) => {
  try {
    const body = await c.req.json();
    const response = await facilitator.handleRequest({
      method: "POST",
      path: "/verify",
      body,
    });
    return c.json(response.body, response.status as any); // 修正: as any を追加
  } catch (error) {
    return c.json(
      {
        error: "Invalid JSON body",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

// POST /facilitator/settle - 支払いを決済
app.post("/facilitator/settle", async (c) => {
  try {
    const body = await c.req.json();
    const response = await facilitator.handleRequest({
      method: "POST",
      path: "/settle",
      body,
    });
    return c.json(response.body, response.status as any); // 修正: as any を追加
  } catch (error) {
    return c.json(
      {
        error: "Invalid JSON body",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400
    );
  }
});

// 404ハンドラー
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: "The requested endpoint does not exist",
    },
    404
  );
});

// エラーハンドラー
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message:
        appConfig.nodeEnv === "development" ? err.message : "An error occurred",
    },
    500
  );
});

// サーバー起動
export default app;

// 直接実行時のみサーバーを起動
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = appConfig.port;
  console.log(`🚀 Server starting on http://localhost:${port}`);

  // Node.jsの場合
  const { serve } = await import("@hono/node-server");
  serve({
    fetch: app.fetch,
    port,
  });
}
