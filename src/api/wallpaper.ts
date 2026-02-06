import { invoke } from '@tauri-apps/api/core';
import type {
  LocalWallpaper,
  WallpaperCategory,
  WallpaperStationResponse,
  SetWallpaperResult,
  WallpaperFitMode,
} from '../types';

/**
 * 壁纸API服务类
 * @description 处理壁纸相关的所有API调用，包括本地壁纸管理和壁纸站服务
 */
export const wallpaperApi = {
  // ============================================
  // 本地壁纸操作
  // ============================================

  /**
   * 获取所有本地壁纸列表
   * @returns Promise<LocalWallpaper[]> 本地壁纸数组
   */
  async getLocalWallpapers(): Promise<LocalWallpaper[]> {
    return invoke('get_local_wallpapers');
  },

  /**
   * 导入本地壁纸图片
   * @param filePaths 图片文件路径数组
   * @returns Promise<LocalWallpaper[]> 导入的壁纸数组
   */
  async importWallpapers(filePaths: string[]): Promise<LocalWallpaper[]> {
    console.log('[wallpaperApi] 开始导入，文件数量:', filePaths.length);
    console.log('[wallpaperApi] 文件路径:', filePaths);
    const result = await invoke('import_wallpapers', { filePaths: JSON.stringify(filePaths) }) as LocalWallpaper[];
    console.log('[wallpaperApi] 导入结果:', result);
    return result;
  },

  /**
   * 删除本地壁纸
   * @param wallpaperId 壁纸ID
   * @returns Promise<void>
   */
  async deleteLocalWallpaper(wallpaperId: string): Promise<void> {
    return invoke('delete_local_wallpaper', { wallpaperId });
  },

  /**
   * 批量删除本地壁纸
   * @param wallpaperIds 壁纸ID数组
   * @returns Promise<void>
   */
  async deleteLocalWallpapers(wallpaperIds: string[]): Promise<void> {
    return invoke('delete_local_wallpapers', { wallpaperIds: JSON.stringify(wallpaperIds) });
  },

  /**
   * 获取本地壁纸缩略图
   * @param wallpaperId 壁纸ID
   * @param width 缩略图宽度
   * @param height 缩略图高度
   * @returns Promise<string> 缩略图数据URL
   */
  async getWallpaperThumbnail(
    wallpaperId: string,
    width: number = 300,
    height: number = 200
  ): Promise<string> {
    return invoke('get_wallpaper_thumbnail', { wallpaperId, width, height });
  },

  // ============================================
  // 壁纸站操作
  // ============================================

  /**
   * 获取壁纸站分类列表
   * @returns Promise<WallpaperCategory[]> 分类数组
   */
  async getWallpaperCategories(): Promise<WallpaperCategory[]> {
    return invoke('get_wallpaper_categories');
  },

  /**
   * 获取壁纸站壁纸列表
   * @param categoryId 分类ID，不传则获取全部
   * @param page 页码，从1开始
   * @param pageSize 每页数量
   * @returns Promise<WallpaperStationResponse> 分页响应
   */
  async getWallpaperStationWallpapers(
    categoryId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<WallpaperStationResponse> {
    return invoke('get_wallpaper_station_wallpapers', { categoryId, page, pageSize });
  },

  /**
   * 下载壁纸站壁纸到本地
   * @param wallpaperId 壁纸ID
   * @returns Promise<LocalWallpaper> 下载后的本地壁纸
   */
  async downloadWallpaper(wallpaperId: string): Promise<LocalWallpaper> {
    return invoke('download_wallpaper', { wallpaperId });
  },

  /**
   * 搜索壁纸站壁纸
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   * @returns Promise<WallpaperStationResponse> 分页响应
   */
  async searchWallpapers(
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<WallpaperStationResponse> {
    return invoke('search_wallpapers', { keyword, page, pageSize });
  },

  // ============================================
  // 壁纸设置操作
  // ============================================

  /**
   * 设置系统壁纸
   * @param wallpaperId 壁纸ID（本地或远程）
   * @param fitMode 适配模式
   * @param monitorId 显示器ID（多显示器时使用）
   * @returns Promise<SetWallpaperResult> 设置结果
   */
  async setWallpaper(
    wallpaperId: string,
    fitMode: WallpaperFitMode = 'fill',
    monitorId?: string
  ): Promise<SetWallpaperResult> {
    return invoke('set_wallpaper', { wallpaperId, fitMode, monitorId });
  },

  /**
   * 设置本地文件为壁纸
   * @param filePath 本地文件路径
   * @param fitMode 适配模式
   * @param monitorId 显示器ID
   * @returns Promise<SetWallpaperResult> 设置结果
   */
  async setLocalWallpaper(
    filePath: string,
    fitMode: WallpaperFitMode = 'fill',
    monitorId?: string
  ): Promise<SetWallpaperResult> {
    return invoke('set_local_wallpaper', { filePath, fitMode, monitorId });
  },

  /**
   * 获取系统当前壁纸信息
   * @returns Promise<{ filePath: string; fitMode: WallpaperFitMode }> 当前壁纸信息
   */
  async getCurrentWallpaper(): Promise<{ filePath: string; fitMode: WallpaperFitMode }> {
    return invoke('get_current_wallpaper');
  },

  /**
   * 获取可用显示器列表
   * @returns Promise<Array<{ id: string; name: string; width: number; height: number }>> 显示器数组
   */
  async getMonitors(): Promise<
    Array<{ id: string; name: string; width: number; height: number }>
  > {
    return invoke('get_monitors');
  },

  /**
   * 获取壁纸适配模式列表
   * @returns WallpaperFitMode[] 适配模式数组
   */
  getFitModes(): WallpaperFitMode[] {
    return ['fill', 'fit', 'stretch', 'tile', 'center'];
  },
};
