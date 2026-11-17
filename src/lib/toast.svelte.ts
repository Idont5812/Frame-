export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export const toasts = $state<{ items: ToastItem[] }>({ items: [] });

let nextId = 1;

export function dismissToast(id: number): void {
  toasts.items = toasts.items.filter((toast) => toast.id !== id);
}

export function toast(
  message: string,
  type: ToastType = "info",
  duration = 3000
): void {
  const id = nextId++;
  toasts.items = [...toasts.items, { id, message, type }];
  setTimeout(() => dismissToast(id), duration);
}
