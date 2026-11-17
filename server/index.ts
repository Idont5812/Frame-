import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { logger } from "./logger.ts";
import { authRouter } from "./routes/auth.ts";
import { videosRouter } from "./routes/videos.ts";
import { usersRouter } from "./routes/users.ts";
import {
  apiLimiter,
  apiNotFound,
  compressionFilter,
  configureApp,
  errorHandler,
  securityHeaders
} from "./middleware/http.ts";

const app = express();
configureApp(app);

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(compressionFilter);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

/* Production static frontend (built by `npm run build`) */
const distExists = fs.existsSync(path.join(config.distDir, "index.html"));
if (distExists) {
  app.use(
    express.static(config.distDir, {
      index: "index.html",
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      }
    })
  );
}

/* Uploaded media: random filenames make URLs immutable. */
app.use(
  "/uploads",
  express.static(config.uploadsDir, {
    maxAge: "30d",
    immutable: true,
    fallthrough: false
  })
);

app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Frame° API" });
});

app.use("/api/auth", authRouter);
app.use("/api/videos", videosRouter);
app.use("/api/users", usersRouter);

app.use("/api", apiNotFound);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use(errorHandler);

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info(`Frame° API listening on port ${config.port}`, {
    production: config.isProduction,
    staticFrontend: distExists,
    dbPath: config.dbPath
  });
});

function shutdown(signal: string): void {
  logger.info("Shutting down", { signal });
  server.close(() => {
    db.close();
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 3000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
});
