<script lang="ts">
  import Eye from "@lucide/svelte/icons/eye";
  import Heart from "@lucide/svelte/icons/heart";
  import Star from "@lucide/svelte/icons/star";
  import Play from "@lucide/svelte/icons/play";
  import { formatRelativeTime } from "../lib/format";
  import { prefs } from "../lib/prefs.svelte";
  import type { Video } from "../types";

  let { video }: { video: Video } = $props();

  const hoverCapable =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let preview: HTMLVideoElement | null = $state(null);
  let previewActive = $state(false);
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;

  function startPreview() {
    if (!hoverCapable || !prefs.hoverPreviews) return;

    hoverTimer = setTimeout(() => {
      if (!preview || preview.src === "") return;
      preview.muted = true;
      preview.currentTime = 0;
      preview
        .play()
        .then(() => (previewActive = true))
        .catch(() => (previewActive = false));
    }, 380);
  }

  function stopPreview() {
    clearTimeout(hoverTimer);
    previewActive = false;
    if (preview && !preview.paused) preview.pause();
  }

  const title = $derived(video.title || "Untitled video");
</script>

<a
  class="video-card"
  href="/pages/watch.html?id={encodeURIComponent(video.id)}"
  onmouseenter={startPreview}
  onmouseleave={stopPreview}
>
  <div class="video-thumbnail">
    <img
      src={video.thumbnail || "/placeholder-thumbnail.svg"}
      alt=""
      loading="lazy"
    />

    {#if hoverCapable}
      <video
        bind:this={preview}
        class="card-preview"
        class:is-active={previewActive}
        src={video.videoUrl}
        muted
        loop
        playsinline
        preload="none"
        tabindex="-1"
        aria-hidden="true"
      ></video>
    {/if}

    <span class="video-duration">{video.duration || "0:00"}</span>

    <div class="thumbnail-overlay">
      <span>
        <Play size={11} />
        WATCH VIDEO
      </span>
    </div>
  </div>

  <div class="video-card-info">
    <div class="video-card-heading">
      <h3 title={title}>{title}</h3>

      {#if video.starred}
        <Star class="video-starred-icon" size={15} fill="currentColor" />
      {/if}
    </div>

    <p class="video-uploader">
      {video.uploaderName || "Frame° creator"}
    </p>

    <div class="video-metadata">
      <span>
        <Eye size={13} /> {video.views}
      </span>
      <span>
        <Heart size={13} /> {video.likes}
      </span>
      <span>
        {formatRelativeTime(video.uploadedAt) || "Recently uploaded"}
      </span>
    </div>
  </div>
</a>
