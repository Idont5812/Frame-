import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const page = (name: string) => resolve(root, "pages", `${name}.html`);

export default defineConfig({
  plugins: [svelte()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".zrok.io"],
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000"
    }
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        watch: page("watch"),
        login: page("login"),
        signup: page("signup"),
        forgot: page("forgot"),
        upload: page("upload"),
        starred: page("starred"),
        account: page("account")
      },
      output: {
        // Long-lived vendor chunks: app changes don't invalidate framework code.
        manualChunks(id) {
          if (id.includes("node_modules/svelte") || id.includes("svelte/src")) {
            return "svelte-vendor";
          }
          if (id.includes("node_modules/@lucide")) {
            return "lucide-vendor";
          }
        }
      }
    }
  }
});
