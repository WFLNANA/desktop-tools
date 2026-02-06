import { create } from 'zustand';
import type { DirectoryBinding, ResourceItem } from '../types';
import { directoryApi } from '../api/directory';
import { useSettingsStore } from './settingsStore';

export interface FileTypeStats {
  fileType: string;
  count: number;
  totalSize: number;
}

export interface FileCategoryStats {
  category: string;
  icon: string;
  count: number;
  totalSize: number;
  percentage: number;
}

interface ResourceStore {
  bindings: DirectoryBinding[];
  resources: ResourceItem[];
  loading: boolean;
  error: string | null;
  showHidden: boolean;
  scanProgress: {
    totalFiles: number;
    scannedFiles: number;
  };

  // Actions
  loadBindings: (categoryId: number) => Promise<void>;
  addBinding: (categoryId: number, path: string) => Promise<void>;
  removeBinding: (bindingId: number, categoryId?: number) => Promise<void>;
  scanDirectory: (categoryId: number) => Promise<void>;
  scanDirectoryBatch: (categoryId: number) => Promise<void>;
  setShowHidden: (show: boolean) => void;
  clearResources: () => void;
  getFileTypeStats: () => FileTypeStats[];
  getFileCategoryStats: () => FileCategoryStats[];
  getTotalFileCount: () => number;
}

export const useResourceStore = create<ResourceStore>((set, get) => ({
  bindings: [],
  resources: [],
  loading: false,
  error: null,
  showHidden: false,
  scanProgress: {
    totalFiles: 0,
    scannedFiles: 0,
  },

  loadBindings: async (categoryId: number) => {
    set({ loading: true, error: null });
    try {
      const bindings = await directoryApi.getBindings(categoryId);
      set({ bindings, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addBinding: async (categoryId: number, path: string) => {
    set({ loading: true, error: null });
    try {
      await directoryApi.bindDirectory(categoryId, path);
      await get().loadBindings(categoryId);
      await get().scanDirectory(categoryId);
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  removeBinding: async (bindingId: number, categoryId?: number) => {
    set({ loading: true, error: null });
    try {
      await directoryApi.unbindDirectory(bindingId);
      const newBindings = get().bindings.filter((b) => b.id !== bindingId);
      set({ bindings: newBindings, loading: false });
      if (newBindings.length === 0) {
        set({ resources: [] });
      } else if (categoryId) {
        await get().scanDirectory(categoryId);
      }
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  scanDirectory: async (categoryId: number) => {
    set({ loading: true, error: null });
    try {
      const { scanIgnoreDirectories } = useSettingsStore.getState();
      const resources = await directoryApi.scanDirectory(categoryId, get().showHidden, scanIgnoreDirectories || undefined);
      set({ resources, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  scanDirectoryBatch: async (categoryId: number) => {
    set({ loading: true, error: null, resources: [] });
    try {
      const { scanIgnoreDirectories } = useSettingsStore.getState();
      const batchSize = 1000;
      let isComplete = false;

      while (!isComplete) {
        const progress = await directoryApi.scanDirectoryBatch(
          categoryId,
          get().showHidden,
          scanIgnoreDirectories || undefined,
          batchSize
        );

        set((state) => ({
          resources: [...state.resources, ...progress.current_batch],
          scanProgress: {
            totalFiles: progress.total_files,
            scannedFiles: progress.scanned_files,
          },
        }));

        isComplete = progress.is_complete;

        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      set({ loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  setShowHidden: (show: boolean) => {
    set({ showHidden: show });
  },

  clearResources: () => {
    set({ resources: [] });
  },

  getFileCategoryStats: () => {
    const { resources } = get();
    const categoryMap = new Map<string, { count: number; totalSize: number; icon: string }>();
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'];
    const documentTypes = ['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt', 'ods'];
    const videoTypes = ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'm4v', '3gp'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    
    resources.forEach((resource) => {
      const fileType = resource.file_type.toLowerCase();
      let category = '其他';
      let icon = '📄';
      
      if (imageTypes.includes(fileType)) {
        category = '图片';
        icon = '🖼️';
      } else if (documentTypes.includes(fileType)) {
        category = '文档';
        icon = '📝';
      } else if (videoTypes.includes(fileType)) {
        category = '视频';
        icon = '🎬';
      } else if (audioTypes.includes(fileType)) {
        category = '音频';
        icon = '🎵';
      } else if (archiveTypes.includes(fileType)) {
        category = '压缩包';
        icon = '📦';
      }
      
      const existing = categoryMap.get(category) || { count: 0, totalSize: 0, icon };
      categoryMap.set(category, {
        count: existing.count + 1,
        totalSize: existing.totalSize + resource.file_size,
        icon: existing.icon,
      });
    });
    
    const totalCount = resources.length;
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      icon: stats.icon,
      count: stats.count,
      totalSize: stats.totalSize,
      percentage: totalCount > 0 ? Math.round((stats.count / totalCount) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  },

  getTotalFileCount: () => {
    return get().resources.length;
  },

  getFileTypeStats: () => {
    const { resources } = get();
    const statsMap = new Map<string, { count: number; totalSize: number }>();
    
    resources.forEach((resource) => {
      const fileType = resource.file_type.toLowerCase();
      const existing = statsMap.get(fileType) || { count: 0, totalSize: 0 };
      statsMap.set(fileType, {
        count: existing.count + 1,
        totalSize: existing.totalSize + resource.file_size,
      });
    });
    
    return Array.from(statsMap.entries()).map(([fileType, stats]) => ({
      fileType,
      count: stats.count,
      totalSize: stats.totalSize,
    })).sort((a, b) => b.count - a.count);
  },
}));
