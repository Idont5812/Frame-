import { spawn } from "node:child_process";
import process from "node:process";

// Runs the Vite dev server and the API server together, forwarding output
// and shutting both down cleanly on Ctrl+C or when one of them exits.
const children = [];

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env
  });

  const label = `[${name}] `;
  const forward = (stream, out) => {
    let buffered = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      buffered += chunk;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) out.write(label + line + "\n");
    });
    stream.on("end", () => {
      if (buffered) out.write(label + buffered + "\n");
    });
  };

  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  children.push(child);
  return child;
}

run("api", "node", ["--watch", "server/index.ts"]);
run("web", "node", ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"]);

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
