<script lang="ts">
  let { index = 0 }: { index?: number } = $props();

  // Staggered entrance so skeletons cascade in with the feed rhythm.
  const delay = $derived(Math.min(index * 45, 320));
</script>

<div
  class="skeleton-card"
  style="animation: skeleton-in 260ms cubic-bezier(0.22,0.61,0.36,1) {delay}ms both;"
  aria-hidden="true"
>
  <div class="skeleton-thumb"></div>
  <div class="skeleton-line w-70"></div>
  <div class="skeleton-line w-40"></div>
</div>
