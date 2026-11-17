<script lang="ts">
  import CloudUpload from "@lucide/svelte/icons/cloud-upload";
  import Film from "@lucide/svelte/icons/film";
  import ImagePlus from "@lucide/svelte/icons/image-plus";
  import AppShell from "../components/AppShell.svelte";
  import { api } from "../services/api";
  import { auth } from "../lib/auth.svelte";

  // Reads the real duration from the selected video file so the card
  // shows an accurate length instead of a placeholder.
  function readVideoDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const probe = document.createElement("video");
      probe.preload = "metadata";

      const cleanup = (result: number | null) => {
        URL.revokeObjectURL(url);
        probe.removeAttribute("src");
        resolve(result);
      };

      probe.onloadedmetadata = () => {
        cleanup(Number.isFinite(probe.duration) ? probe.duration : null);
      };
      probe.onerror = () => cleanup(null);

      probe.src = url;
    });
  }

  let title = $state("");
  let description = $state("");
  let videoFile = $state<File | null>(null);
  let thumbnailFile = $state<File | null>(null);
  let busy = $state(false);
  let error = $state("");

  function handleVideoChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    videoFile = input.files?.[0] ?? null;
    error = "";
  }

  function handleThumbnailChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    thumbnailFile = input.files?.[0] ?? null;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = "";

    if (!videoFile) {
      error = "Choose a video file first.";
      return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);

    const duration = await readVideoDuration(videoFile);
    if (duration !== null) {
      form.append("durationSeconds", String(Math.round(duration)));
    }

    form.append("video", videoFile);

    if (thumbnailFile) {
      form.append("thumbnail", thumbnailFile);
    }

    busy = true;

    try {
      const result = await api.uploadVideo(form);

      if (result.video?.id) {
        window.location.href = `/pages/watch.html?id=${encodeURIComponent(result.video.id)}`;
        return;
      }

      error = "Upload finished, but the video could not be opened.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Upload failed.";
    } finally {
      busy = false;
    }
  }
</script>

<AppShell>
  <p class="page-eyebrow">CREATOR STUDIO</p>
  <h1 class="page-title">Put it out there.</h1>
  <p class="page-subtitle">Give your next video a place to live.</p>

  {#if auth.loading}
    <div class="empty-state" style="margin-top:35px;">
      <p>Loading your studio...</p>
    </div>
  {:else if !auth.user}
    <div class="empty-state" style="margin-top:35px;">
      <CloudUpload size={24} />
      <h3>Sign in to upload</h3>
      <p>Your creator studio is available after signing in.</p>
      <a class="primary-button" href="/pages/login.html">
        Sign in
      </a>
    </div>
  {:else}
    <form class="upload-form" onsubmit={(event) => void submit(event)}>
      <label class="upload-dropzone" for="video-file">
        <Film size={28} />
        <strong>{videoFile ? videoFile.name : "Choose your video"}</strong>
        <span>
          {videoFile
            ? "Video selected"
            : "Select a video file from your device"}
        </span>
        <input
          id="video-file"
          type="file"
          accept="video/*"
          onchange={handleVideoChange}
        />
      </label>

      <div class="form-field">
        <label for="title">Video title</label>
        <input
          id="title"
          required
          maxlength={120}
          bind:value={title}
          placeholder="Give your video a title"
        />
      </div>

      <div class="form-field">
        <label for="description">Description</label>
        <textarea
          id="description"
          maxlength={3000}
          bind:value={description}
          placeholder="What's this video about?"
        ></textarea>
      </div>

      <label class="thumbnail-picker" for="thumbnail-file">
        <ImagePlus size={19} />
        <span>
          {thumbnailFile
            ? thumbnailFile.name
            : "Choose a custom thumbnail (optional)"}
        </span>
        <input
          id="thumbnail-file"
          type="file"
          accept="image/*"
          onchange={handleThumbnailChange}
        />
      </label>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <button class="primary-button" disabled={busy}>
        <CloudUpload size={16} />
        {busy ? "Uploading..." : "Upload video"}
      </button>
    </form>
  {/if}
</AppShell>
