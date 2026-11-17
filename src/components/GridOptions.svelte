<script lang="ts">
  import { prefs, setPref } from "../lib/prefs.svelte";
  import { maxColumnsFor } from "../lib/grid";

  let { viewportWidth }: { viewportWidth: number } = $props();

  const cap = $derived(maxColumnsFor(viewportWidth));
  const options = $derived(
    Array.from({ length: Math.max(1, cap - 1) }, (_, i) => i + 2)
  );
</script>

<div class="grid-options" role="radiogroup" aria-label="Videos per row">
  {#each options as n (n)}
    <button
      class="grid-option"
      class:is-active={prefs.gridCols === n}
      role="radio"
      aria-checked={prefs.gridCols === n}
      aria-label="{n} videos per row"
      title="{n} videos per row"
      onclick={() => setPref("gridCols", n)}
    >
      {#each Array(n) as _, i (i)}
        <i></i>
      {/each}
    </button>
  {/each}
</div>

<p class="grid-option-note">
  Up to {cap} per row on this screen.
</p>
