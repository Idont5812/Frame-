<script lang="ts">
  import { pop } from "../lib/transitions";

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open = false,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    onConfirm,
    onCancel
  }: Props = $props();

  $effect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });
</script>

{#if open}
  <div
    class="confirm-backdrop"
    onmousedown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}
  >
    <section
      class="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      transition:pop={{ duration: 200, y: 10, start: 0.95 }}
    >
      <h3 id="confirm-title">{title}</h3>
      <p>{message}</p>

      <div class="confirm-actions">
        <button class="btn-secondary" onclick={onCancel}>
          {cancelText}
        </button>

        <button
          class={danger ? "btn-danger" : "btn-primary"}
          onclick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </section>
  </div>
{/if}
