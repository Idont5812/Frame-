<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Heart from "@lucide/svelte/icons/heart";
  import Star from "@lucide/svelte/icons/star";
  import Eye from "@lucide/svelte/icons/eye";
  import CalendarDays from "@lucide/svelte/icons/calendar-days";
  import Share2 from "@lucide/svelte/icons/share-2";
  import AppShell from "../components/AppShell.svelte";
  import VideoPlayer from "../components/VideoPlayer.svelte";
  import VideoCard from "../components/VideoCard.svelte";
  import VideoCardSkeleton from "../components/VideoCardSkeleton.svelte";
  import { api } from "../services/api";
  import { auth } from "../lib/auth.svelte";
  import type { Video } from "../types";

  const id = new URLSearchParams(window.location.search).get("id");

  let video = $state<Video | null>(null);
  let related = $state<Video[]>([]);
  let loading = $state(id !== null);
  let error = $state(id ? "" : "No video was selected.");
  let busy = $state(false);

  $effect(() => {
    if (!id) return;

    let active = true;

    async function load() {
      try {
        const result = await api.video(id ?? "");
        if (!active) return;

        video = result.video;
        related = result.related ?? [];
      } catch (err) {
        if (active) {
          error = err instanceof Error ? err.message : "Video unavailable.";
        }
      } finally {
        if (active) loading = false;
      }
    }

    void load();
    return () => {
      active = false;
    };
  });

  async function interact(
    action: (id: number) => Promise<{ video: Video }>
  ) {
    if (!auth.user) {
      window.location.href = "/pages/login.html";
      return;
    }

    if (busy || !video) return;
    busy = true;

    try {
      const result = await action(video.id);
      if (video) video = { ...video, ...result.video };
    } catch (err) {
      error = err instanceof Error ? err.message : "Action failed.";
    } finally {
      busy = false;
    }
  }

  async function shareVideo() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title ?? "Frame° video", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // The user may cancel the share dialog.
    }
  }
</script>

<AppShell>
  {#if loading}
    <div class="watch-layout">
      <div class="watch-main">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-line w-70" style="margin-top:20px;"></div>
        <div class="skeleton-line w-40"></div>
      </div>
    </div>
  {:else if error || !video}
    <div class="empty-state">
      <h3>Video unavailable</h3>
      <p>{error || "This video could not be found."}</p>
      <a class="primary-button" href="/">
        Back to home
      </a>
    </div>
  {:else}
    <a class="back-link" href="/">
      <ArrowLeft size={15} />
      Back to feed
    </a>

    <div class="watch-layout">
      <main class="watch-main">
        <VideoPlayer src={video.videoUrl} poster={video.thumbnail} />

        <div class="watch-title-row">
          <div>
            <p class="page-eyebrow">NOW PLAYING</p>
            <h1 class="watch-title">{video.title}</h1>
          </div>
        </div>

        <div class="watch-info-row">
          <div class="watch-creator">
            <div class="creator-avatar">
              {(video.uploader || "F").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{video.uploader || "Frame° creator"}</strong>
              <span>Creator</span>
            </div>
          </div>

          <div class="watch-actions">
            <button
              class="secondary-button"
              class:is-active={video.liked}
              disabled={busy}
              onclick={() => void interact(api.like)}
            >
              <Heart size={15} fill={video.liked ? "currentColor" : "none"} />
              {video.likes}
            </button>

            <button
              class="secondary-button"
              class:is-active={video.starred}
              disabled={busy}
              onclick={() => void interact(api.star)}
            >
              <Star size={15} fill={video.starred ? "currentColor" : "none"} />
              {video.starred ? "Starred" : "Star"}
            </button>

            <button
              class="secondary-button"
              onclick={() => void shareVideo()}
            >
              <Share2 size={15} />
              Share
            </button>
          </div>
        </div>

        <div class="watch-stats">
          <span>
            <Eye size={14} /> {video.views} views
          </span>
          <span>
            <CalendarDays size={14} /> {video.uploadedAt || "Recently uploaded"}
          </span>
        </div>

        {#if video.description}
          <div class="video-description">{video.description}</div>
        {/if}

        {#if error}
          <p class="error-message">{error}</p>
        {/if}
      </main>

      <aside class="watch-sidebar">
        <p class="page-eyebrow">KEEP EXPLORING</p>
        <h2>Up next</h2>

        {#if related.length}
          <div class="related-list">
            {#each related as item (item.id)}
              <VideoCard video={item} />
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <p>No other videos yet.</p>
          </div>
        {/if}
      </aside>
    </div>
  {/if}
</AppShell>
