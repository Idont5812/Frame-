import bcrypt from "bcryptjs";
import { db } from "../db.ts";
import type { AccountStats, PublicUser } from "../lib/format.ts";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string | null;
}

export function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at
  };
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string
): UserRow {
  return db.transaction((): UserRow => {
    const result = db
      .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
      .run(name, email, passwordHash);

    const id = Number(result.lastInsertRowid);
    const row = getUserById(id);
    if (!row) throw new Error("User row disappeared after insert.");
    return row;
  })();
}

export function updateName(userId: number, name: string): void {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
}

export function updatePassword(userId: number, passwordHash: string): void {
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
    passwordHash,
    userId
  );
}

export function verifyPassword(
  user: UserRow,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function getStats(userId: number): AccountStats {
  const uploads = (
    db
      .prepare("SELECT COUNT(*) AS count FROM videos WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;

  const starred = (
    db
      .prepare("SELECT COUNT(*) AS count FROM stars WHERE user_id = ?")
      .get(userId) as { count: number }
  ).count;

  const views = (
    db
      .prepare(
        `SELECT COUNT(views.id) AS count
         FROM views JOIN videos ON videos.id = views.video_id
         WHERE videos.user_id = ?`
      )
      .get(userId) as { count: number }
  ).count;

  return { uploads, starred, views };
}
