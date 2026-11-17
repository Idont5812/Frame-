<script lang="ts">
  import { fly } from "svelte/transition";
  import Check from "@lucide/svelte/icons/check";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Info from "@lucide/svelte/icons/info";
  import X from "@lucide/svelte/icons/x";
  import { toasts, dismissToast } from "../lib/toast.svelte";
</script>

<div class="toast-container" aria-live="polite">
  {#each toasts.items as item (item.id)}
    <div class="frame-toast toast-{item.type}" transition:fly={{ y: 12, duration: 200 }}>
      {#if item.type === "success"}
        <Check size={17} />
      {:else if item.type === "error"}
        <CircleAlert size={17} />
      {:else}
        <Info size={17} />
      {/if}

      <span>{item.message}</span>

      <button
        class="toast-close"
        onclick={() => dismissToast(item.id)}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  {/each}
</div>
