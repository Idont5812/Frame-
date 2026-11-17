<script lang="ts">
  import Dock from "./Dock.svelte";
  import type { PublicUser } from "../types";

  interface Props {
    onSearch?: (query: string) => void;
    user?: PublicUser | null;
  }

  let { onSearch, user = null }: Props = $props();
</script>

<header class="site-header">
  <a class="wordmark" href="/">
    Frame<span>°</span>
  </a>

  <Dock {onSearch} {user} />
</header>
