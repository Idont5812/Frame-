<script lang="ts">
  import { slide } from "svelte/transition";
  import Search from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
  import type { PublicUser } from "../types";

  interface Props {
    onSearch?: (query: string) => void;
    user?: PublicUser | null;
  }

  let { onSearch, user = null }: Props = $props();

  let searchOpen = $state(false);
  let query = $state("");

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = query.trim();

    if (onSearch) {
      onSearch(trimmed);
      if (!trimmed) searchOpen = false;
      return;
    }

    // On pages without a live feed, route the search to the home page.
    if (trimmed) {
      window.location.href = `/?search=${encodeURIComponent(trimmed)}`;
    }
    searchOpen = false;
    query = "";
  }

  function closeSearch() {
    searchOpen = false;
    query = "";
  }
</script>

<div class="live-dock" class:live-dock-search={searchOpen}>
  {#if !searchOpen}
    <div class="dock-status">
      <span class="live-dot"></span>
      <span class="dock-label">LIVE UPDATES</span>
      <span class="dock-separator">·</span>
      <span class="dock-message">{user ? "Signed in to your space" : "Your feed is ready"}</span>
    </div>

    <button
      class="dock-icon-button"
      aria-label="Search videos"
      onclick={() => (searchOpen = true)}
    >
      <Search size={17} strokeWidth={1.8} />
    </button>
  {:else}
    <form class="dock-search-form" transition:slide={{ duration: 200 }} onsubmit={submitSearch}>
      <Search size={17} />
      <input
        bind:value={query}
        placeholder="Search your video space..."
        aria-label="Search videos"
      />
      <button class="dock-submit" type="submit" aria-label="Submit search">
        <ArrowUpRight size={17} />
      </button>
      <button
        class="dock-icon-button"
        type="button"
        aria-label="Close search"
        onclick={closeSearch}
      >
        <X size={17} />
      </button>
    </form>
  {/if}
</div>
