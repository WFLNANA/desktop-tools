// 基础类型定义

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: number;
  sort_order: number;
  has_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  directory_count: number;
  resource_count: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export type DeleteStrategy = 'DeleteAll' | 'PromoteChildren';

export interface DirectoryBinding {
  id: number;
  category_id: number;
  directory_path: string;
  created_at: string;
}

export interface ResourceItem {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  modified_at: string;
}

export interface SearchResult {
  resource: ResourceItem;
  category_name: string;
}

// ============================================
// Wallpaper Types - 壁纸模块类型定义
// ============================================

/**
 * 壁纸来源类型
 */
export type WallpaperSource = 'local' | 'remote';

/**
 * 壁纸适配模式
 */
export type WallpaperFitMode = 'fill' | 'fit' | 'stretch' | 'tile' | 'center';

/**
 * 壁纸显示模式
 */
export type WallpaperDisplayMode = 'local' | 'station';

/**
 * 壁纸分类标签
 */
export interface WallpaperCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count?: number;
}

/**
 * 壁纸缩略图信息
 */
export interface WallpaperThumbnail {
  url: string;
  width: number;
  height: number;
  size?: number;
}

export * from './wallpaper';

/**
 * 壁纸信息
 */
export interface Wallpaper {
  id: string;
  url: string;
  thumbnail?: WallpaperThumbnail;
  title?: string;
  description?: string;
  source: WallpaperSource;
  tags?: string[];
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  author?: string;
  createdAt: number;
  isFavorite?: boolean;
}

// ============================================
// System Info Types - 系统信息类型定义
// ============================================

export interface TemperatureInfo {
  label: string;
  temperature: number;
}

export interface FanInfo {
  label: string;
  rpm: number;
}

export interface CpuCoreInfo {
  id: number;
  name: string;
  usage: number;
  frequency: number;
}

export interface LoadAvg {
  one: number;
  five: number;
  fifteen: number;
}

export interface CpuInfo {
  model: string;
  cores: number;
  threads: number;
  frequency: number;
  usage: number;
  loadAverage: LoadAvg;
  perCore: CpuCoreInfo[];
  temperature?: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  available: number;
  cached?: number;
  usage: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
  temperature?: number;
}

export interface DiskInfo {
  name: string;
  mountPoint: string;
  fileSystem: string;
  total: number;
  available: number;
  used: number;
  usage: number;
  isRemovable: boolean;
  temperature?: number;
}

export interface GpuInfo {
  name: string;
  driverVersion?: string;
  memoryTotal?: number;
  memoryUsed?: number;
  memoryFree?: number;
  utilization?: number;
  temperature?: number;
  fanSpeed?: number;
}

export interface NetworkInfo {
  name: string;
  received: number;
  transmitted: number;
  totalReceived: number;
  totalTransmitted: number;
  macAddress: string;
}

export interface OsInfo {
  name: string;
  version: string;
  kernelVersion: string;
  longVersion?: string;
  arch: string;
}

export interface SystemInfo {
  timestamp: number;
  uptime: number;
  deviceName: string;
  os: OsInfo;
  cpu: CpuInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  gpus: GpuInfo[];
  temperatures: TemperatureInfo[];
  fans: FanInfo[];
  networks: NetworkInfo[];
}

// ============================================
// Environment Variable Types - 环境变量类型定义
// ============================================

export interface EnvironmentVariable {
  id: string;
  name: string;
  value: string;
  description?: string;
  category: string;
  isSystem: boolean;
  isModified: boolean;
  createdAt: number;
  modifiedAt: number;
}

export interface CreateEnvVarRequest {
  name: string;
  value: string;
  description?: string;
  category: string;
}

export interface UpdateEnvVarRequest {
  value?: string;
  description?: string;
  category?: string;
}

export interface EnvVarCategory {
  name: string;
  count: number;
  color?: string;
}
