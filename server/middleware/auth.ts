import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.ts";
import { getUserById, type UserRow } from "../services/users.ts";
import { logger } from "../logger.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserRow;
  }
}

export function signSession(res: Response, userId: number): void {
  const token = jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: "7d"
  });

  res.cookie("frame_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    maxAge: config.sessionMaxAgeMs,
    path: "/"
  });
}

export function clearSession(res: Response): void {
  res.clearCookie("frame_session", { path: "/" });
}

export function readUserIdFromCookie(req: Request): number | null {
  const token = req.cookies?.frame_session;
  if (typeof token !== "string" || token.length === 0) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "object" && payload && typeof payload.id === "number") {
      return payload.id;
    }
    return null;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.frame_session;
  if (!token) {
    res.status(401).json({ error: "Please sign in first." });
    return;
  }

  let userId: number | null = null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "object" && payload && typeof payload.id === "number") {
      userId = payload.id;
    }
  } catch {
    res.status(401).json({ error: "Please sign in again." });
    return;
  }

  if (userId === null) {
    res.status(401).json({ error: "Please sign in again." });
    return;
  }

  const user = getUserById(userId);
  if (!user) {
    res.status(401).json({ error: "Session is no longer valid." });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = readUserIdFromCookie(req);
  if (userId !== null) {
    const user = getUserById(userId);
    if (!user) {
      logger.warn("Stale session referenced a missing user", { userId });
    } else {
      req.user = user;
    }
  }
  next();
}
