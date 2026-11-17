/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./pages/*.html", "./src/**/*.{ts,svelte}"],
  corePlugins: {
    // The project's own reset in src/styles/global.css is authoritative;
    // Tailwind preflight would override existing visual design tokens.
    preflight: false
  }
};
