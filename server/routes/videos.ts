import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config.ts";
import { requireAuth, optionalAuth } from "../middleware/auth.ts";
import {
  createVideo,
  deleteVideoRow,
  getOwnedVideo,
  getVideo,
  listVideos,
  relatedVideos,
  recordView,
  toggleLike,
  toggleStar,
  videoExists
} from "../services/videos.ts";
import { logger } from "../logger.ts";

export const videosRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, file.fieldname === "thumbnail" ? config.thumbDir : config.videoDir);
  },
  filename: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadBytes,
    files: 2
  },
  fileFilter: (_req, file, cb) => {
    const isVideo =
      file.fieldname === "video" && file.mimetype.startsWith("video/");
    const isImage =
      file.fieldname === "thumbnail" && file.mimetype.startsWith("image/");
    cb(null, isVideo || isImage);
  }
});

function cleanupUpload(...files: Array<string | null | undefined>): void {
  for (const file of files) {
    if (!file) continue;
    fs.unlink(file, (err) => {
      if (err && err.code !== "ENOENT") {
        logger.warn("Failed to remove orphaned upload", { file, error: err });
      }
    });
  }
}

function parseVideoId(raw: unknown): number | null {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/* Catalogue, search, sorting, pagination */

videosRouter.get("/", optionalAuth, (req, res, next) => {
  try {
    const result = listVideos({
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      limit: Number(req.query.limit) || undefined,
      offset: Number(req.query.offset) || undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
      viewerId: req.user?.id ?? null
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

videosRouter.get("/:id", optionalAuth, (req, res, next) => {
  try {
    const id = parseVideoId(req.params.id);
    if (id === null) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    if (!videoExists(id)) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    recordView(id, req.user?.id ?? null);

    const video = getVideo(id, req.user?.id ?? null);
    const related = relatedVideos(id, req.user?.id ?? null);

    res.json({ video, related });
  } catch (err) {
    next(err);
  }
});

/* Interactions */

videosRouter.post("/:id/like", requireAuth, (req, res, next) => {
  try {
    const id = parseVideoId(req.params.id);
    if (id === null || !videoExists(id)) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    toggleLike(id, req.user!.id);
    res.json({ video: getVideo(id, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

videosRouter.post("/:id/star", requireAuth, (req, res, next) => {
  try {
    const id = parseVideoId(req.params.id);
    if (id === null || !videoExists(id)) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    toggleStar(id, req.user!.id);
    res.json({ video: getVideo(id, req.user!.id) });
  } catch (err) {
    next(err);
  }
});

/* Upload */

videosRouter.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  (req, res, next) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const videoFile = files?.video?.[0];
      const thumbnailFile = files?.thumbnail?.[0];
      const title = String(req.body?.title ?? "").trim();
      const description = String(req.body?.description ?? "").trim();
      const durationSeconds = Number(req.body?.durationSeconds);

      if (!videoFile) {
        cleanupUpload(thumbnailFile?.path);
        res.status(400).json({ error: "Select a video file." });
        return;
      }

      if (title.length < 1 || title.length > 120) {
        cleanupUpload(videoFile.path, thumbnailFile?.path);
        res.status(400).json({ error: "Title must be 1-120 characters." });
        return;
      }

      const duration = Number.isFinite(durationSeconds)
        ? Math.min(Math.max(durationSeconds, 0), 86400)
        : 0;

      try {
        const id = createVideo({
          userId: req.user!.id,
          title,
          description,
          videoPath: `/uploads/videos/${path.basename(videoFile.path)}`,
          thumbnailPath: thumbnailFile
            ? `/uploads/thumbnails/${path.basename(thumbnailFile.path)}`
            : null,
          durationSeconds: duration
        });

        res.status(201).json({ video: getVideo(id, req.user!.id) });
      } catch (err) {
        // Database insert failed: remove the stored files so nothing is orphaned.
        cleanupUpload(videoFile.path, thumbnailFile?.path);
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

/* Delete (owner only) */

videosRouter.delete("/:id", requireAuth, (req, res, next) => {
  try {
    const id = parseVideoId(req.params.id);
    if (id === null) {
      res.status(404).json({ error: "Your video was not found." });
      return;
    }

    const owned = getOwnedVideo(id, req.user!.id);
    if (!owned) {
      res.status(404).json({ error: "Your video was not found." });
      return;
    }

    deleteVideoRow(id);

    for (const relative of [owned.video_path, owned.thumbnail_path]) {
      if (relative?.startsWith("/uploads/")) {
        const absolute = path.join(
          config.uploadsDir,
          relative.replace("/uploads/", "")
        );
        fs.unlink(absolute, (err) => {
          if (err && err.code !== "ENOENT") {
            logger.warn("Failed to remove video file", { file: absolute, error: err });
          }
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
