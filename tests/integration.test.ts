import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "frame-test-"));
const uploadsDir = path.join(workDir, "uploads");

const server = spawn(
  process.execPath,
  ["server/index.ts"],
  {
    env: {
      ...process.env,
      PORT: String(PORT),
      FRAME_DB_PATH: path.join(workDir, "test.db"),
      FRAME_UPLOADS_DIR: uploadsDir,
      JWT_SECRET: "test-secret-0123456789abcdefghijklmn"
    },
    stdio: ["ignore", "pipe", "pipe"]
  }
);

let serverLog = "";
server.stdout.setEncoding("utf8");
server.stderr.setEncoding("utf8");
server.stdout.on("data", (chunk) => (serverLog += chunk));
server.stderr.on("data", (chunk) => (serverLog += chunk));

async function waitForHealth(attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) return;
    } catch {
      // Server not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start.\n${serverLog}`);
}

test.after(() => {
  server.kill("SIGTERM");
});

// API responses are dynamic test fixtures; this keeps the assertions readable
// without weakening type checking in the application code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json<T = any>(response: Response): Promise<T> {
  return (await response.json()) as T;
}


async function register(
  name: string,
  email: string,
  password: string
): Promise<{
    status: number;
    body: { user?: { id: number; name: string; email: string } };
    cookie: string;
  }> {
  const response = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  return {
    status: response.status,
    body: (await response.json().catch(() => ({}))) as { user?: { id: number; name: string; email: string } },
    cookie: response.headers.getSetCookie()[0]?.split(";")[0] ?? ""
  };
}

function cookieHeader(session: { cookie: string }): Record<string, string> {
  return { cookie: session.cookie };
}

async function login(
  email: string,
  password: string
): Promise<{
    status: number;
    body: { user?: { id: number; name: string; email: string } };
    cookie: string;
  }> {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return {
    status: response.status,
    body: (await response.json().catch(() => ({}))) as {
      user?: { id: number; name: string; email: string };
    },
    cookie: response.headers.getSetCookie()[0]?.split(";")[0] ?? ""
  };
}

test("server starts and reports health", async () => {
  await waitForHealth();
  const response = await fetch(`${BASE}/api/health`);
  const body = await json<{ ok: boolean }>(response);
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test("register rejects invalid input", async () => {
  const badEmail = await register("Bad", "not-an-email", "password123");
  assert.equal(badEmail.status, 400);

  const shortPassword = await register("Bad", "a@b.co", "short");
  assert.equal(shortPassword.status, 400);

  const badName = await register("", "a@b.co", "password123");
  assert.equal(badName.status, 400);
});

test("register, session, logout flow", async () => {
  const created = await register("Smoke Tester", "smoke@test.frame", "password123");
  assert.equal(created.status, 201);
  assert.equal(created.body.user?.name, "Smoke Tester");
  assert.ok(created.cookie.startsWith("frame_session="));

  const me = await fetch(`${BASE}/api/auth/me`, {
    headers: cookieHeader({ cookie: created.cookie })
  });
  const meBody = await json<{ user: { email: string } }>(me);
  assert.equal(meBody.user.email, "smoke@test.frame");

  const duplicate = await register(
    "Other",
    "smoke@test.frame",
    "password123"
  );
  assert.equal(duplicate.status, 409);

  const logout = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: cookieHeader({ cookie: created.cookie })
  });
  assert.equal(logout.status, 200);
});

test("login enforces credentials", async () => {
  const wrong = await login("smoke@test.frame", "wrongpass99");
  assert.equal(wrong.status, 401);

  const right = await login("smoke@test.frame", "password123");
  assert.equal(right.status, 200);
  assert.ok(right.cookie.startsWith("frame_session="));
});

test("upload, watch, view dedup, like, star, delete", async () => {
  const session = await login("smoke@test.frame", "password123");
  const headers = cookieHeader({
    cookie: session.cookie,
  });

  // Upload
  const bytes = new Uint8Array(1024);
  const form = new FormData();
  form.append("title", "Integration Clip");
  form.append("description", "Created by the test suite");
  form.append("durationSeconds", "125");
  form.append(
    "video",
    new Blob([bytes], { type: "video/mp4" }),
    "clip.mp4"
  );

  const upload = await fetch(`${BASE}/api/videos`, {
    method: "POST",
    headers: headers,
    body: form
  });
  assert.equal(upload.status, 201);
  const uploaded = await json<{ video: { duration: string; id: number } }>(
    upload
  );
  assert.equal(uploaded.video.duration, "2:05");
  const videoId: number = uploaded.video.id;

  // Watch: first view records
  const watch = await fetch(`${BASE}/api/videos/${videoId}`, {
    headers: headers
  });
  assert.equal(watch.status, 200);
  const watchBody = await json<{
    video: { title: string; views: number; videoUrl: string };
    related: Array<{ id: number }>;
  }>(watch);
  assert.equal(watchBody.video.title, "Integration Clip");
  assert.equal(watchBody.video.views, 1);
  assert.ok(watchBody.video.videoUrl.startsWith("/uploads/videos/"));

  // Watch again quickly: deduped within 60s
  const again = await fetch(`${BASE}/api/videos/${videoId}`, {
    headers: headers
  });
  const againBody = await json<{ video: { views: number } }>(again);
  assert.equal(againBody.video.views, 1);

  // Related excludes itself
  assert.ok(!watchBody.related.some((v) => v.id === videoId));

  // Like toggle
  const like1 = await fetch(`${BASE}/api/videos/${videoId}/like`, {
    method: "POST",
    headers: headers
  });
  assert.equal((await json<{ video: { likes: number } }>(like1)).video.likes, 1);

  const like2 = await fetch(`${BASE}/api/videos/${videoId}/like`, {
    method: "POST",
    headers: headers
  });
  assert.equal((await json<{ video: { likes: number } }>(like2)).video.likes, 0);

  // Star toggle + starred list
  await fetch(`${BASE}/api/videos/${videoId}/star`, {
    method: "POST",
    headers: headers
  });
  const starred = await fetch(`${BASE}/api/users/me/starred`, {
    headers: headers
  });
  const starredBody = await json<{ videos: Array<{ id: number }> }>(starred);
  assert.ok(starredBody.videos.some((v) => v.id === videoId));

  // Search
  const search = await fetch(
    `${BASE}/api/videos?search=${encodeURIComponent("integration")}`
  );
  const searchBody = await json<{
    videos: Array<{ id: number }>;
    total: number;
    limit: number;
    offset: number;
  }>(search);
  assert.equal(searchBody.total, 1);
  assert.equal(searchBody.videos[0]?.id, videoId);

  // Pagination metadata
  assert.equal(searchBody.limit, 24);
  assert.equal(searchBody.offset, 0);

  // Another user cannot delete someone else's video
  const other = await register("Other User", "other@test.frame", "password123");
  const foreignDelete = await fetch(`${BASE}/api/videos/${videoId}`, {
    method: "DELETE",
    headers: cookieHeader({
      cookie: other.cookie,
    })
  });
  assert.equal(foreignDelete.status, 404);

  // Owner delete removes files
  const beforeFiles = fs.readdirSync(path.join(uploadsDir, "videos")).length;
  const ownerDelete = await fetch(`${BASE}/api/videos/${videoId}`, {
    method: "DELETE",
    headers: headers
  });
  assert.equal(ownerDelete.status, 200);

  const gone = await fetch(`${BASE}/api/videos/${videoId}`, {
    headers: headers
  });
  assert.equal(gone.status, 404);

  const afterFiles = fs.readdirSync(path.join(uploadsDir, "videos")).length;
  assert.equal(afterFiles, beforeFiles - 1);
});

test("list endpoints expose pagination", async () => {
  const response = await fetch(`${BASE}/api/videos?limit=1&offset=0`);
  const body = await json<{ videos: unknown[]; total: number; limit: number }>(
    response
  );
  assert.equal(body.limit, 1);
  assert.ok(Array.isArray(body.videos));
  assert.ok(body.videos.length <= 1);
  assert.equal(typeof body.total, "number");
});

test("account update and password change", async () => {
  const session = await login("other@test.frame", "password123");
  const headers = cookieHeader({
    cookie: session.cookie,
  });

  const renamed = await fetch(`${BASE}/api/users/me`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Renamed User" })
  });
  assert.equal(renamed.status, 200);
  assert.equal(
    (await json<{ user: { name: string } }>(renamed)).user.name,
    "Renamed User"
  );

  // Wrong current password rejected
  const badChange = await fetch(`${BASE}/api/users/me/password`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: "totally-wrong",
      newPassword: "newpassword99"
    })
  });
  assert.equal(badChange.status, 401);

  const goodChange = await fetch(`${BASE}/api/users/me/password`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: "password123",
      newPassword: "newpassword99"
    })
  });
  assert.equal(goodChange.status, 200);

  const relogin = await login("other@test.frame", "newpassword99");
  assert.equal(relogin.status, 200);
});

test("validation and unknown endpoints respond as JSON", async () => {
  const missing = await fetch(`${BASE}/api/videos/abc`);
  assert.equal(missing.status, 404);
  assert.ok((await json<{ error: string }>(missing)).error);

  const unknown = await fetch(`${BASE}/api/bogus`);
  assert.equal(unknown.status, 404);
  assert.ok((await json<{ error: string }>(unknown)).error);

  const relogin = await login("other@test.frame", "newpassword99");
  const oversizedTitle = await fetch(`${BASE}/api/videos`, {
    method: "POST",
    headers: cookieHeader({
      cookie: relogin.cookie,
    })
  });
  assert.equal(oversizedTitle.status, 400);
});
