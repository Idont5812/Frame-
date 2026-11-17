import { api } from "../services/api";
import type { PublicUser } from "../types";

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
}

export const auth: AuthState = $state({
  user: null,
  loading: true
});

export async function refreshUser(): Promise<PublicUser | null> {
  try {
    const result = await api.me();
    auth.user = result.user ?? null;
    return auth.user;
  } catch {
    auth.user = null;
    return null;
  } finally {
    auth.loading = false;
  }
}

export async function logoutUser(): Promise<void> {
  await api.logout();
  auth.user = null;
}

export function initAuth(): void {
  void refreshUser();
}
