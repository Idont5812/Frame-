export interface PublicUser {
  id: number;
  name: string;
  email: string;
  createdAt: string | null;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string | null;
  duration: string;
  uploader: string;
  uploaderName: string;
  uploadedAt: string | null;
  likes: number;
  views: number;
  liked: boolean;
  starred: boolean;
}

export interface VideoListResult {
  videos: Video[];
  total: number;
  limit: number;
  offset: number;
}

export interface AccountStats {
  uploads: number;
  starred: number;
  views: number;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(rest).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function escapeLikeTerm(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
