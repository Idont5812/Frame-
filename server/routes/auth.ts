import bcrypt from "bcryptjs";
import { Router } from "express";
import {
  createUser,
  getUserByEmail,
  getUserById,
  publicUser,
  verifyPassword
} from "../services/users.ts";
import { clearSession, readUserIdFromCookie, signSession } from "../middleware/auth.ts";
import { authLimiter } from "../middleware/http.ts";

// Compared against when the email is unknown so that login takes a similar
// amount of time whether or not the account exists (timing oracle guard).
const DUMMY_HASH = bcrypt.hashSync("frame-timing-guard", 12);

export const authRouter = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (name.length < 1 || name.length > 40) {
      res.status(400).json({ error: "Name must be 1-40 characters." });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: "Password must be 8-128 characters." });
      return;
    }

    let user;
    try {
      user = createUser(name, email, await bcrypt.hash(password, 12));
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        res
          .status(409)
          .json({ error: "An account with that email already exists." });
        return;
      }
      throw err;
    }

    signSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    const user = getUserByEmail(email);

    if (user && (await verifyPassword(user, password))) {
      signSession(res, user.id);
      res.json({ user: publicUser(user) });
      return;
    }

    if (!user) {
      // Keep timing similar to the successful-compare path.
      await bcrypt.compare(password, DUMMY_HASH);
    }

    res.status(401).json({ error: "Incorrect email or password." });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", (req, res) => {
  const userId = readUserIdFromCookie(req);
  const user = userId === null ? undefined : getUserById(userId);
  res.json({ user: user ? publicUser(user) : null });
});

authRouter.post("/logout", (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});
