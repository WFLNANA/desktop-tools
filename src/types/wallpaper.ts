export interface LocalWallpaper {
  id: string;
  name: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  width?: number;
  height?: number;
  modified_at: string;
  created_at: string;
  // Compatibility fields for UI if needed, but try to use file_path
  url?: string; 
  title?: string;
}

export interface RemoteWallpaper {
  id: string;
  name: string;
  file_path: string;
  thumbnail_url?: string;
  original_url: string;
  width: number;
  height: number;
  file_size: number;
  category_id?: string;
  category_name?: string;
  author?: string;
  tags: string[];
}

export interface WallpaperStationResponse {
  wallpapers: RemoteWallpaper[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SetWallpaperResult {
  success: boolean;
  message?: string;
  error_code?: string;
}

export interface WallpaperPreviewState {
  isOpen: boolean;
  currentWallpaper: LocalWallpaper | RemoteWallpaper | null;
  currentIndex: number;
  playlist: (LocalWallpaper | RemoteWallpaper)[];
}

