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

export interface WatchResponse {
  video: Video;
  related: Video[];
}

export interface AccountResponse {
  user: PublicUser;
  stats: AccountStats;
}
