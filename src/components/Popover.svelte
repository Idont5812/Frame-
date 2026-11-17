<script lang="ts">
  import type { Snippet } from "svelte";
  import { pop } from "../lib/transitions";

  interface Props {
    open?: boolean;
    placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
    ariaLabel?: string;
    trigger: Snippet;
    content: Snippet;
  }

  let {
    open = $bindable(false),
    placement = "bottom-end",
    ariaLabel = "Menu",
    trigger,
    content
  }: Props = $props();

  let anchor: HTMLElement | null = $state(null);

  const originMap = {
    "bottom-start": "top left",
    "bottom-end": "top right",
    "top-start": "bottom left",
    "top-end": "bottom right"
  } as const;

  function onPointerDown(event: PointerEvent) {
    if (!open || !anchor) return;
    if (!anchor.contains(event.target as Node)) open = false;
  }

  function onKeyDown(event: KeyboardEvent) {
    if (open && event.key === "Escape") open = false;
  }

  $effect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  });
</script>

<span
  bind:this={anchor}
  class="popover-anchor"
>
  {@render trigger()}

  {#if open}
    <div
      class="popover-panel glass-strong"
      style:--origin={originMap[placement]}
      style:right={placement.endsWith("end") ? "0" : "auto"}
      style:left={placement.endsWith("start") ? "0" : "auto"}
      style:top={placement.startsWith("top") ? "auto" : "calc(100% + 10px)"}
      style:bottom={placement.startsWith("top") ? "calc(100% + 10px)" : "auto"}
      role="menu"
      aria-label={ariaLabel}
      transition:pop={{ duration: 180, y: placement.startsWith("top") ? 8 : -6 }}
    >
      {@render content()}
    </div>
  {/if}
</span>
