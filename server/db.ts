import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.ts";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration TEXT DEFAULT '0:00',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS stars (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_views_video ON views(video_id);
CREATE INDEX IF NOT EXISTS idx_views_video_user ON views(video_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_video ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_stars_video ON stars(video_id);
`);
