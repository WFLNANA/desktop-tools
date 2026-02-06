export interface Wallpaper {
  id: string;
  url: string; // Local path or remote URL
  thumbnail?: string;
  title: string;
  source: 'local' | 'online';
  width?: number;
  height?: number;
  size?: number;
  path?: string; // For local files
}

export interface Category {
  id: string;
  name: string;
  count?: number;
}
