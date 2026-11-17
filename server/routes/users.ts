import { Router } from "express";
import {
  getStats,
  getUserById,
  publicUser,
  updateName,
  updatePassword,
  verifyPassword,
  hashPassword
} from "../services/users.ts";
import { requireAuth } from "../middleware/auth.ts";
import { authLimiter } from "../middleware/http.ts";
import { listStarredVideos, listOwnedVideos } from "../services/videos.ts";

export const usersRouter = Router();

usersRouter.use("/me", requireAuth);

usersRouter.get("/me", (req, res) => {
  const user = req.user!;
  res.json({ user: publicUser(user), stats: getStats(user.id) });
});

usersRouter.patch("/me", (req, res) => {
  const name = String(req.body?.name ?? "").trim();

  if (name.length < 1 || name.length > 40) {
    res.status(400).json({ error: "Name must be 1-40 characters." });
    return;
  }

  updateName(req.user!.id, name);

  const fresh = getUserById(req.user!.id);
  res.json({ user: fresh ? publicUser(fresh) : null });
});

usersRouter.patch("/me/password", authLimiter, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ error: "New password must be 8-128 characters." });
      return;
    }

    const valid = await verifyPassword(req.user!, currentPassword);
    if (!valid) {
      res.status(401).json({ error: "Your current password is incorrect." });
      return;
    }

    updatePassword(req.user!.id, await hashPassword(newPassword));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

usersRouter.get("/me/starred", (req, res) => {
  res.json({ videos: listStarredVideos(req.user!.id) });
});

usersRouter.get("/me/videos", (req, res) => {
  res.json({ videos: listOwnedVideos(req.user!.id) });
});
