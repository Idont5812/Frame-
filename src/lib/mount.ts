import { mount as svelteMount, unmount } from "svelte";
import { initAuth } from "./auth.svelte";
import { initPrefs } from "./prefs.svelte";
import Toasts from "../components/Toasts.svelte";
import BottomNav from "../components/BottomNav.svelte";
import type { Component } from "svelte";

export function mount(Page: Component): void {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Frame°: #root element not found.");
  }

  initPrefs();
  initAuth();

  const app = svelteMount(Page, { target: rootElement });
  const chrome = svelteMount(Toasts, { target: document.body });
  const nav = svelteMount(BottomNav, { target: document.body });

  window.addEventListener("pagehide", () => {
    unmount(app);
    unmount(chrome);
    unmount(nav);
  }, { once: true });
}
