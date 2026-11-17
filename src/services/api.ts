import type {
  AccountResponse,
  PublicUser,
  Video,
  VideoListResult,
  WatchResponse
} from "../types";

const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    },
    ...options
  });

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const record = (data ?? {}) as { error?: unknown; message?: unknown };
    const message =
      typeof record.error === "string"
        ? record.error
        : typeof record.message === "string"
          ? record.message
          : "Something went wrong.";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Authentication
  me: () => request<{ user: PublicUser | null }>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ user: PublicUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  signup: (name: string, email: string, password: string) =>
    request<{ user: PublicUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  // Videos
  videos: (params: { search?: string; limit?: number; offset?: number; sort?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.search) search.set("search", params.search);
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    if (params.offset !== undefined) search.set("offset", String(params.offset));
    if (params.sort) search.set("sort", params.sort);
    const query = search.toString();
    return request<VideoListResult>(`/videos${query ? `?${query}` : ""}`);
  },
  video: (id: string | number) =>
    request<WatchResponse>(`/videos/${encodeURIComponent(id)}`),
  uploadVideo: (formData: FormData) =>
    request<{ video: Video }>("/videos", { method: "POST", body: formData }),
  deleteVideo: (id: number) =>
    request<{ ok: boolean }>(`/videos/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }),

  // Video interactions
  like: (id: number) =>
    request<{ video: Video }>(`/videos/${encodeURIComponent(id)}/like`, {
      method: "POST"
    }),
  star: (id: number) =>
    request<{ video: Video }>(`/videos/${encodeURIComponent(id)}/star`, {
      method: "POST"
    }),

  // Account
  starred: () => request<{ videos: Video[] }>("/users/me/starred"),
  myVideos: () => request<{ videos: Video[] }>("/users/me/videos"),
  account: () => request<AccountResponse>("/users/me"),
  updateAccount: (details: { name: string }) =>
    request<{ user: PublicUser }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(details)
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword })
    })
};
