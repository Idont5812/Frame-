import type { TransitionConfig } from "svelte/transition";

interface PopParams {
  duration?: number;
  y?: number;
  start?: number;
}

// Scale + fade + rise, used by popovers, dialogs and menus so everything
// shares one entrance/exit language.
export function pop(node: Element, params: PopParams = {}): TransitionConfig {
  const duration = params.duration ?? 180;
  const y = params.y ?? 6;
  const start = params.start ?? 0.96;

  return {
    duration,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    css: (t) =>
      `opacity: ${t}; transform: translateY(${(1 - t) * y}px) scale(${start + (1 - start) * t});`
  };
}
