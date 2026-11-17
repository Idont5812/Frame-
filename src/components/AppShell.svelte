<script lang="ts">
  import type { Snippet } from "svelte";

  import Header from "./Header.svelte";

  interface Props {
    children: Snippet;
    onSearch?: (query: string) => void;
  }

  let { children, onSearch }: Props = $props();
</script>

<div class="app-shell">
  <Header {onSearch} />
  <main class="page-content">
    {@render children()}
  </main>
</div>
