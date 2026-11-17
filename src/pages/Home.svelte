<script lang="ts">
  import { fly } from "svelte/transition";
  import Compass from "@lucide/svelte/icons/compass";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import AppShell from "../components/AppShell.svelte";
  import VideoCard from "../components/VideoCard.svelte";
  import VideoCardSkeleton from "../components/VideoCardSkeleton.svelte";
  import Popover from "../components/Popover.svelte";
  import GridOptions from "../components/GridOptions.svelte";
  import { api } from "../services/api";
  import { prefs } from "../lib/prefs.svelte";
  import { effectiveColumns } from "../lib/grid";
  import type { Video } from "../types";

  let videos = $state<Video[]>([]);
  let loading = $state(true);
  let error = $state("");
  let search = $state(
    new URLSearchParams(window.location.search).get("search")?.trim() ?? ""
  );
  let gridOpen = $state(false);
  let viewportWidth = $state(window.innerWidth);

  const columns = $derived(effectiveColumns(prefs.gridCols, viewportWidth));

  // Brief pulse whenever the effective column count changes.
  let gridPulse = $state(false);
  $effect(() => {
    void columns;
    gridPulse = true;
    const timer = setTimeout(() => (gridPulse = false), 260);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    const onResize = () => {
      viewportWidth = window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  async function loadVideos(query = "") {
    try {
      const result = await api.videos(query ? { search: query } : {});
      videos = result.videos ?? [];
      error = "";
    } catch (err) {
      error = err instanceof Error ? err.message : "Couldn't load your feed.";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void loadVideos(search);
  });

  function handleSearch(query: string) {
    search = query;
    loading = true;
    error = "";
  }

  function refresh() {
    loading = true;
    error = "";
    void loadVideos(search);
  }
</script>

<AppShell onSearch={handleSearch}>
  <section class="home-intro">
    <p class="page-eyebrow">YOUR PERSONAL VIDEO SPACE</p>
    <h1 class="page-title">A little more you.</h1>
    <p class="page-subtitle">Pick up where curiosity takes you.</p>
  </section>

  <section class="feed-section">
    <div class="section-heading">
      <div>
        <div class="section-kicker">
          <Compass size={15} />
          <span>{search ? "SEARCH RESULTS" : "YOUR FEED"}</span>
        </div>
        <h2>{search ? `Results for “${search}”` : "Explore videos"}</h2>
      </div>

      <div class="section-controls">
        <Popover bind:open={gridOpen} placement="bottom-end" ariaLabel="Grid size">
          {#snippet trigger()}
            <button
              class="secondary-button"
              data-tooltip="Grid size"
              aria-label="Grid size: {columns} videos per row"
              aria-expanded={gridOpen}
              onclick={() => (gridOpen = !gridOpen)}
            >
              <LayoutGrid size={15} />
              {columns} per row
            </button>
          {/snippet}

          {#snippet content()}
            <p class="popover-title">Grid size</p>
            <GridOptions {viewportWidth} />
          {/snippet}
        </Popover>

        <button
          class="secondary-button"
          onclick={refresh}
          disabled={loading}
          data-tooltip="Refresh feed"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    </div>

    {#if loading}
      <div class="video-grid" style:--grid-cols={columns}>
        {#each Array(6) as _, i (i)}
          <VideoCardSkeleton index={i} />
        {/each}
      </div>
    {:else if error}
      <div class="empty-state">
        <h3>Feed unavailable</h3>
        <p>{error}</p>
        <button class="primary-button" onclick={refresh}>
          Try again
        </button>
      </div>
    {:else if videos.length}
      <div
        class="video-grid"
        class:grid-pulse={gridPulse}
        style:--grid-cols={columns}
      >
        {#each videos as video, i (video.id)}
          <div
            class="video-card-wrap"
            in:fly={{ y: 16, duration: 280, delay: Math.min(i * 35, 300) }}
          >
            <VideoCard {video} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <Sparkles size={22} />
        <h3>{search ? "No matching videos" : "Your feed is waiting"}</h3>
        <p>
          {search
            ? "Try another search term."
            : "Videos will appear here when they're uploaded."}
        </p>
      </div>
    {/if}
  </section>
</AppShell>
