<script lang="ts">
  import { pop } from "../lib/transitions";
  import Popover from "./Popover.svelte";
  import SettingsPanel from "./SettingsPanel.svelte";
  import Settings from "@lucide/svelte/icons/settings";

  let { viewportWidth }: { viewportWidth: number } = $props();

  let open = $state(false);
</script>

<Popover
  bind:open
  placement="top-end"
  ariaLabel="Settings"
>
  {#snippet trigger()}
    <button
      class="nav-item"
      class:is-active={open}
      aria-label="Settings"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      <Settings size={21} strokeWidth={1.7} />
    </button>
  {/snippet}

  {#snippet content()}
    <div style="width: 272px;">
      <p class="popover-title">Settings</p>
      <SettingsPanel {viewportWidth} />
    </div>
  {/snippet}
</Popover>
