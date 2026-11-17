<script lang="ts">
  import Compass from "@lucide/svelte/icons/compass";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import CloudUpload from "@lucide/svelte/icons/cloud-upload";
  import UserRound from "@lucide/svelte/icons/user-round";
  import { auth } from "../lib/auth.svelte";
  import SettingsTrigger from "./SettingsTrigger.svelte";

  let viewportWidth = $state(typeof window !== "undefined" ? window.innerWidth : 1280);

  $effect(() => {
    const onResize = () => {
      viewportWidth = window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  const path = $derived(window.location.pathname);
  const isHome = $derived(path === "/" || path.endsWith("/index.html"));
  const isStarred = $derived(path.includes("starred"));
  const isUpload = $derived(path.includes("upload"));
  const isAccount = $derived(path.includes("account"));
</script>

<nav class="bottom-nav" aria-label="Primary">
  <a
    class="nav-item"
    class:is-active={isHome}
    href="/"
    aria-label="Home"
    data-tooltip="Home"
  >
    <Compass size={21} strokeWidth={1.7} />
  </a>

  <a
    class="nav-item"
    class:is-active={isStarred}
    href="/pages/starred.html"
    aria-label="Starred"
    data-tooltip="Starred"
  >
    <Bookmark size={20} strokeWidth={1.7} />
  </a>

  <a
    class="nav-item"
    class:is-active={isUpload}
    href="/pages/upload.html"
    aria-label="Upload"
    data-tooltip="Upload"
  >
    <CloudUpload size={21} strokeWidth={1.7} />
  </a>

  <a
    class="nav-item"
    class:is-active={isAccount}
    href={auth.user ? "/pages/account.html" : "/pages/login.html"}
    aria-label={auth.user ? "Account" : "Sign in"}
    data-tooltip={auth.user ? auth.user.name : "Sign in"}
  >
    <UserRound size={21} strokeWidth={1.7} />
  </a>

  <SettingsTrigger {viewportWidth} />
</nav>
