import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import weatherRoutes from "./routes/weather.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import { isDatabaseConfigured } from "./config/database.js";

const app = express();
app.disable("x-powered-by");
if (process.env.VERCEL) app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
if (process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN.split(",").map((value) => value.trim()), credentials: true }));
}
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ data: { status: "ok", persistence: isDatabaseConfigured() ? "configured" : "local-only" } }));
app.use("/api", weatherRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res) => res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } }));
app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("API error:", error.message);
  res.status(status).json({ error: { message: status >= 500 ? (error.publicMessage || "An unexpected server error occurred.") : error.message } });
});

export default app;
