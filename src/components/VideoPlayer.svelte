<script lang="ts">
  import Play from "@lucide/svelte/icons/play";
  import Pause from "@lucide/svelte/icons/pause";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import VolumeX from "@lucide/svelte/icons/volume-x";
  import Maximize from "@lucide/svelte/icons/maximize";
  import Minimize from "@lucide/svelte/icons/minimize";
  import Settings from "@lucide/svelte/icons/settings";
  import Theater from "@lucide/svelte/icons/theater";
  import { prefs } from "../lib/prefs.svelte";

  interface Props {
    src: string;
    poster: string | null;
    onEnded?: () => void;
  }

  let { src, poster, onEnded }: Props = $props();

  const RATES = [0.5, 1, 1.25, 1.5, 2] as const;

  let video: HTMLVideoElement | undefined = $state();
  let playing = $state(false);
  let muted = $state(false);
  let theater = $state(false);
  let fullscreen = $state(false);
  let current = $state(0);
  let duration = $state(0);
  let autoStarted = $state(false);

  let rateIndex = $state(
    Math.max(0, RATES.indexOf(prefs.defaultSpeed as (typeof RATES)[number]))
  );
  let rate = $derived(RATES[rateIndex] ?? 1);

  $effect(() => {
    const handleChange = () => {
      fullscreen = document.fullscreenElement !== null;
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  });

  async function togglePlay() {
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        playing = true;
      } catch {
        playing = false;
      }
    } else {
      video.pause();
      playing = false;
    }
  }

  function toggleMute() {
    if (!video) return;
    video.muted = !video.muted;
    muted = video.muted;
    if (!muted) autoStarted = false;
  }

  function toggleFullscreen() {
    if (!video) return;
    const wrap = video.parentElement;

    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void wrap?.requestFullscreen?.();
    }
  }

  function cycleRate() {
    if (!video) return;
    const nextIndex = (rateIndex + 1) % RATES.length;
    video.playbackRate = RATES[nextIndex] ?? 1;
    rateIndex = nextIndex;
  }

  function onMetadata(event: Event) {
    const el = event.currentTarget as HTMLVideoElement;
    duration = el.duration;
    el.playbackRate = prefs.defaultSpeed;

    if (prefs.autoplay && el.paused) {
      el.muted = true;
      el.play()
        .then(() => {
          playing = true;
          muted = true;
          autoStarted = true;
        })
        .catch(() => undefined);
    }
  }
</script>

<div class="player-wrap" class:player-theater={theater}>
  <!-- svelte-ignore a11y_media_has_caption -->
  <video
    bind:this={video}
    class="frame-player"
    {src}
    poster={poster ?? undefined}
    playsinline
    onplay={() => (playing = true)}
    onpause={() => (playing = false)}
    onended={onEnded}
    ontimeupdate={(event) => (current = event.currentTarget.currentTime)}
    onloadedmetadata={onMetadata}
    onvolumechange={(event) => (muted = event.currentTarget.muted)}
    onclick={() => void togglePlay()}
  ></video>

  {#if autoStarted && muted}
    <button class="player-unmute-hint" onclick={toggleMute}>
      <VolumeX size={14} />
      Tap for sound
    </button>
  {/if}

  <div class="player-controls">
    <button onclick={() => void togglePlay()} aria-label={playing ? "Pause" : "Play"}>
      {#if playing}
        <Pause size={19} />
      {:else}
        <Play size={19} />
      {/if}
    </button>

    <button onclick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
      {#if muted}
        <VolumeX size={18} />
      {:else}
        <Volume2 size={18} />
      {/if}
    </button>

    <span class="player-time">
      {Math.floor(current / 60)}:{String(Math.floor(current % 60)).padStart(2, "0")}
      /
      {Math.floor((duration || 0) / 60)}:{String(Math.floor((duration || 0) % 60)).padStart(2, "0")}
    </span>

    <input
      type="range"
      class="player-seek"
      min={0}
      max={duration || 0}
      step={0.1}
      value={Math.min(current, duration || 0)}
      aria-label="Seek"
      onchange={(event) => {
        const el = video;
        if (!el) return;
        const time = Number((event.currentTarget as HTMLInputElement).value);
        el.currentTime = time;
        current = time;
      }}
      oninput={(event) => {
        const el = video;
        if (!el) return;
        const time = Number((event.currentTarget as HTMLInputElement).value);
        el.currentTime = time;
        current = time;
      }}
    />

    <span class="player-spacer"></span>

    <button
      onclick={cycleRate}
      class="flex items-center gap-1 text-[11px] font-semibold tracking-wide"
      aria-label="Playback speed: {rate}x. Activate to change."
      title="Speed {rate}x"
    >
      <Settings size={18} />
      {rate}x
    </button>

    <button
      onclick={() => (theater = !theater)}
      aria-label="Toggle theater mode"
      aria-pressed={theater}
    >
      <Theater size={18} />
    </button>

    <button onclick={toggleFullscreen} aria-label="Toggle fullscreen">
      {#if fullscreen}
        <Minimize size={18} />
      {:else}
        <Maximize size={18} />
      {/if}
    </button>
  </div>
</div>
