import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, "..");

const jwtSecret = process.env.JWT_SECRET ?? "";

if (jwtSecret.length < 24) {
  throw new Error(
    "Frame°: set JWT_SECRET to a random secret of at least 24 characters in .env"
  );
}

const dbPath = process.env.FRAME_DB_PATH || path.join(serverDir, "frame.db");
const uploadsDir = process.env.FRAME_UPLOADS_DIR
  ? path.resolve(process.env.FRAME_UPLOADS_DIR)
  : path.join(serverDir, "uploads");

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  isProduction: process.env.NODE_ENV === "production",
  dbPath,
  uploadsDir,
  videoDir: path.join(uploadsDir, "videos"),
  thumbDir: path.join(uploadsDir, "thumbnails"),
  distDir: path.join(projectRoot, "dist"),
  maxUploadBytes: 1024 * 1024 * 1024,
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  viewDedupSeconds: 60
} as const;

fs.mkdirSync(config.videoDir, { recursive: true });
fs.mkdirSync(config.thumbDir, { recursive: true });
