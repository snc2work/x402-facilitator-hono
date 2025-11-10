import { Hono } from "hono";
import type { Bindings } from "../types/bindings.js";
import health from "./health.js";
import facilitatorRouter from "./facilitator.js";

const routes = new Hono<{ Bindings: Bindings }>();

routes.route("/", health);
routes.route("/", facilitatorRouter);

export default routes;
