<script lang="ts">
  import GridOptions from "./GridOptions.svelte";
  import { prefs, setPref } from "../lib/prefs.svelte";
  import type { MotionPreference } from "../lib/prefs.svelte";

  let { viewportWidth }: { viewportWidth: number } = $props();

  const speeds = [1, 1.25, 1.5, 2];
  const motions: Array<{ value: MotionPreference; label: string }> = [
    { value: "system", label: "System" },
    { value: "full", label: "Full" },
    { value: "reduced", label: "Reduced" }
  ];
</script>

<div class="popover-section">
  <p class="popover-label">Playback</p>

  <button
    class="popover-item"
    role="menuitemcheckbox"
    aria-checked={prefs.autoplay}
    onclick={() => setPref("autoplay", !prefs.autoplay)}
  >
    <span>Autoplay videos</span>
    <i class="switch" class:is-on={prefs.autoplay} aria-hidden="true"></i>
  </button>

  <p class="popover-label">Playback speed</p>
  <div class="segmented" style="margin: 0 12px 4px;">
    {#each speeds as speed (speed)}
      <button
        class:is-active={prefs.defaultSpeed === speed}
        aria-pressed={prefs.defaultSpeed === speed}
        onclick={() => setPref("defaultSpeed", speed)}
      >
        {speed}x
      </button>
    {/each}
  </div>
</div>

<div class="popover-section">
  <p class="popover-label">Browsing</p>

  <button
    class="popover-item"
    role="menuitemcheckbox"
    aria-checked={prefs.hoverPreviews}
    onclick={() => setPref("hoverPreviews", !prefs.hoverPreviews)}
  >
    <span>Hover video previews</span>
    <i class="switch" class:is-on={prefs.hoverPreviews} aria-hidden="true"></i>
  </button>

  <p class="popover-label">Grid size</p>
  <GridOptions {viewportWidth} />
</div>

<div class="popover-section">
  <p class="popover-label">Animations</p>
  <div class="segmented" style="margin: 0 12px 8px;">
    {#each motions as option (option.value)}
      <button
        class:is-active={prefs.motion === option.value}
        aria-pressed={prefs.motion === option.value}
        onclick={() => setPref("motion", option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>
</div>
