<script lang="ts">
  import Star from "@lucide/svelte/icons/star";
  import AppShell from "../components/AppShell.svelte";
  import VideoCard from "../components/VideoCard.svelte";
  import VideoCardSkeleton from "../components/VideoCardSkeleton.svelte";
  import { api } from "../services/api";
  import { auth } from "../lib/auth.svelte";
  import { prefs } from "../lib/prefs.svelte";
  import { effectiveColumns } from "../lib/grid";
  import type { Video } from "../types";

  let videos = $state<Video[]>([]);
  let loading = $state(true);
  let error = $state("");
  let viewportWidth = $state(window.innerWidth);

  const columns = $derived(effectiveColumns(prefs.gridCols, viewportWidth));

  $effect(() => {
    const onResize = () => {
      viewportWidth = window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  $effect(() => {
    if (!auth.user) {
      if (!auth.loading) loading = false;
      return;
    }

    let active = true;

    api
      .starred()
      .then((result) => {
        if (active) videos = result.videos ?? [];
      })
      .catch((err: unknown) => {
        if (active) {
          error =
            err instanceof Error
              ? err.message
              : "Couldn't load starred videos.";
        }
      })
      .finally(() => {
        if (active) loading = false;
      });

    return () => {
      active = false;
    };
  });
</script>

<AppShell>
  <p class="page-eyebrow">YOUR COLLECTION</p>
  <h1 class="page-title">Kept close.</h1>
  <p class="page-subtitle">The videos you decided to keep around.</p>

  {#if !auth.user}
    <div class="empty-state" style="margin-top:34px;">
      <Star size={23} />
      <h3>Your collection awaits</h3>
      <p>Sign in to see your starred videos.</p>
      <a class="primary-button" href="/pages/login.html">
        Sign in
      </a>
    </div>
  {:else if loading}
    <div class="video-grid" style:--grid-cols={columns}>
      {#each Array(4) as _, i (i)}
        <VideoCardSkeleton index={i} />
      {/each}
    </div>
  {:else if error}
    <div class="empty-state" style="margin-top:34px;">
      <p>{error}</p>
    </div>
  {:else if videos.length}
    <div class="video-grid" style:--grid-cols={columns}>
      {#each videos as video (video.id)}
        <VideoCard video={{ ...video, starred: true }} />
      {/each}
    </div>
  {:else}
    <div class="empty-state" style="margin-top:34px;">
      <Star size={23} />
      <h3>Nothing starred yet</h3>
      <p>Star videos you want to find easily later.</p>
      <a class="secondary-button" href="/">
        Explore videos
      </a>
    </div>
  {/if}
</AppShell>
