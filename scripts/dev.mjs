import { spawn } from "node:child_process";
import process from "node:process";

// Run the API and Vite together. If either service exits unexpectedly, stop
// the other one too; Ctrl+C/SIGTERM also shuts down both children cleanly.
const children = new Set();
let shuttingDown = false;
let exitCode = 0;

function run(name, args) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: process.env
  });
  children.add(child);
  child.once("error", (error) => {
    console.error(`[${name}] failed to start:`, error);
    exitCode = 1;
    shutdown();
  });
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (!shuttingDown) {
      exitCode = code ?? (signal ? 1 : 0);
      console.error(`[${name}] exited (${signal ?? code}); stopping the other service.`);
      shutdown();
    }
  });
  return child;
}

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
  const forceTimer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }, 4000);
  forceTimer.unref();
  if (children.size === 0) process.exit(exitCode);
  for (const child of children) {
    child.once("exit", () => {
      if (children.size === 0) process.exit(exitCode);
    });
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

run("api", ["--watch", "server/index.ts"]);
run("web", ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"]);
