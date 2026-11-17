import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger.ts";

export function configureApp(app: { set: (k: string, v: unknown) => void }): void {
  // The app runs behind a single reverse proxy (zrok tunnel) in deployment.
  app.set("trust proxy", 1);
}

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:"],
      "media-src": ["'self'", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "script-src": ["'self'"],
      "connect-src": ["'self'", "ws:", "wss:"],
      "font-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "same-site" }
});

export const compressionFilter = compression();

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down for a moment." }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please wait a few minutes and try again."
  }
});

export function apiNotFound(req: Request, res: Response): void {
  res.status(404).json({ error: "API endpoint not found." });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    logger.error("Headers already sent when error occurred", {
      method: req.method,
      url: req.originalUrl
    });
    return;
  }

  const isMulter =
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "MulterError";

  if (isMulter) {
    const multerError = err as { code?: unknown; message?: unknown };
    const message =
      multerError.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum upload size is 1 GB."
        : "Upload failed. Please check the selected files.";
    res.status(400).json({ error: message });
    return;
  }

  logger.error("Unhandled request failure", {
    method: req.method,
    url: req.originalUrl,
    error: err
  });

  res.status(500).json({ error: "Something went wrong on our side." });
}
