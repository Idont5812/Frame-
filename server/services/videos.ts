import { db } from "../db.ts";
import { config } from "../config.ts";
import {
  escapeLikeTerm,
  formatDuration,
  type Video,
  type VideoListResult
} from "../lib/format.ts";

interface VideoRow {
  id: number;
  title: string;
  description: string;
  video_path: string;
  thumbnail_path: string | null;
  duration: string | null;
  created_at: string | null;
  uploader: string;
  like_count: number;
  view_count: number;
  liked: number;
  starred: number;
}

const LIST_COLUMNS = `
  videos.id,
  videos.title,
  videos.description,
  videos.video_path,
  videos.thumbnail_path,
  videos.duration,
  videos.created_at,
  users.name AS uploader,
  (SELECT COUNT(*) FROM likes WHERE likes.video_id = videos.id) AS like_count,
  (SELECT COUNT(*) FROM views WHERE views.video_id = videos.id) AS view_count,
  EXISTS(
    SELECT 1 FROM likes
    WHERE likes.video_id = videos.id AND likes.user_id = @viewerId
  ) AS liked,
  EXISTS(
    SELECT 1 FROM stars
    WHERE stars.video_id = videos.id AND stars.user_id = @viewerId
  ) AS starred
`;

const SORTS: Record<string, string> = {
  newest: "videos.created_at DESC",
  oldest: "videos.created_at ASC",
  popular: "view_count DESC",
  liked: "like_count DESC"
};

function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_path,
    thumbnail: row.thumbnail_path,
    duration: row.duration || "0:00",
    uploader: row.uploader,
    uploaderName: row.uploader,
    uploadedAt: row.created_at,
    likes: row.like_count,
    views: row.view_count,
    liked: !!row.liked,
    starred: !!row.starred
  };
}

export function listStarredVideos(viewerId: number): Video[] {
  const rows = db
    .prepare(
      `SELECT ${LIST_COLUMNS}
       FROM stars
       JOIN videos ON videos.id = stars.video_id
       JOIN users ON users.id = videos.user_id
       WHERE stars.user_id = @viewerId
       ORDER BY videos.created_at DESC`
    )
    .all({ viewerId }) as VideoRow[];

  return rows.map(toVideo);
}

export function listOwnedVideos(userId: number): Video[] {
  const rows = db
    .prepare(
      `SELECT ${LIST_COLUMNS}
       FROM videos JOIN users ON users.id = videos.user_id
       WHERE videos.user_id = @viewerId
       ORDER BY videos.created_at DESC`
    )
    .all({ viewerId: userId }) as VideoRow[];

  return rows.map(toVideo);
}

export function listVideos(options: {
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  viewerId: number | null;
}): VideoListResult {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const orderBy = SORTS[options.sort ?? "newest"] ?? SORTS["newest"]!;
  const search = options.search?.trim() ?? "";
  const viewerId = options.viewerId ?? -1;

  const base = `FROM videos JOIN users ON users.id = videos.user_id`;
  const where = search
    ? `WHERE videos.title LIKE @pattern ESCAPE '\\'
       OR videos.description LIKE @pattern ESCAPE '\\'
       OR users.name LIKE @pattern ESCAPE '\\'`
    : "";

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS count ${base} ${where}`)
    .get({ pattern: search ? `%${escapeLikeTerm(search)}%` : "%" }) as {
    count: number;
  };

  const rows = db
    .prepare(
      `SELECT ${LIST_COLUMNS} ${base} ${where}
       ORDER BY ${orderBy}
       LIMIT @limit OFFSET @offset`
    )
    .all({
      viewerId,
      pattern: search ? `%${escapeLikeTerm(search)}%` : "%",
      limit,
      offset
    }) as VideoRow[];

  return {
    videos: rows.map(toVideo),
    total: totalRow.count,
    limit,
    offset
  };
}

export function getVideo(
  id: number,
  viewerId: number | null
): Video | undefined {
  const row = db
    .prepare(
      `SELECT ${LIST_COLUMNS}
       FROM videos JOIN users ON users.id = videos.user_id
       WHERE videos.id = @id`
    )
    .get({ id, viewerId: viewerId ?? -1 }) as VideoRow | undefined;

  return row ? toVideo(row) : undefined;
}

export function relatedVideos(
  videoId: number,
  viewerId: number | null,
  limit = 8
): Video[] {
  const rows = db
    .prepare(
      `SELECT ${LIST_COLUMNS}
       FROM videos JOIN users ON users.id = videos.user_id
       WHERE videos.id != @videoId
       ORDER BY videos.created_at DESC
       LIMIT @limit`
    )
    .all({ viewerId: viewerId ?? -1, videoId, limit }) as VideoRow[];

  return rows.map(toVideo);
}

export function videoExists(id: number): boolean {
  return !!db.prepare("SELECT 1 FROM videos WHERE id = ?").get(id);
}

export function recordView(videoId: number, userId: number | null): void {
  if (userId !== null) {
    const recent = db
      .prepare(
        `SELECT 1 FROM views
         WHERE video_id = ? AND user_id = ?
           AND viewed_at >= datetime('now', '-${config.viewDedupSeconds} seconds')
         LIMIT 1`
      )
      .get(videoId, userId);

    if (recent) return;
  }

  db.prepare("INSERT INTO views (video_id, user_id) VALUES (?, ?)").run(
    videoId,
    userId
  );
}

export interface CreateVideoInput {
  userId: number;
  title: string;
  description: string;
  videoPath: string;
  thumbnailPath: string | null;
  durationSeconds: number;
}

export function createVideo(input: CreateVideoInput): number {
  const insert = db.transaction((): number => {
    const result = db
      .prepare(
        `INSERT INTO videos (user_id, title, description, video_path, thumbnail_path, duration)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.userId,
        input.title,
        input.description.slice(0, 3000),
        input.videoPath,
        input.thumbnailPath,
        formatDuration(input.durationSeconds)
      );

    return Number(result.lastInsertRowid);
  });

  return insert();
}

export function getOwnedVideo(
  id: number,
  userId: number
): { video_path: string; thumbnail_path: string | null } | undefined {
  return db
    .prepare(
      "SELECT video_path, thumbnail_path FROM videos WHERE id = ? AND user_id = ?"
    )
    .get(id, userId) as { video_path: string; thumbnail_path: string | null } | undefined;
}

export function deleteVideoRow(id: number): void {
  db.prepare("DELETE FROM videos WHERE id = ?").run(id);
}

export function toggleLike(videoId: number, userId: number): void {
  const toggle = db.transaction(() => {
    const existing = db
      .prepare("SELECT 1 FROM likes WHERE user_id = ? AND video_id = ?")
      .get(userId, videoId);

    if (existing) {
      db.prepare("DELETE FROM likes WHERE user_id = ? AND video_id = ?").run(
        userId,
        videoId
      );
    } else {
      db.prepare("INSERT INTO likes (user_id, video_id) VALUES (?, ?)").run(
        userId,
        videoId
      );
    }
  });

  toggle();
}

export function toggleStar(videoId: number, userId: number): void {
  const toggle = db.transaction(() => {
    const existing = db
      .prepare("SELECT 1 FROM stars WHERE user_id = ? AND video_id = ?")
      .get(userId, videoId);

    if (existing) {
      db.prepare("DELETE FROM stars WHERE user_id = ? AND video_id = ?").run(
        userId,
        videoId
      );
    } else {
      db.prepare("INSERT INTO stars (user_id, video_id) VALUES (?, ?)").run(
        userId,
        videoId
      );
    }
  });

  toggle();
}
