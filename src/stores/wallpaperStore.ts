import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  LocalWallpaper,
  RemoteWallpaper,
  Wallpaper,
  WallpaperCategory,
  WallpaperDisplayMode,
  WallpaperFitMode,
  WallpaperPreviewState,
} from '../types';
import { wallpaperApi } from '../api/wallpaper';

interface WallpaperState {
  // 显示模式
  displayMode: WallpaperDisplayMode;
  setDisplayMode: (mode: WallpaperDisplayMode) => void;

  // 本地壁纸
  localWallpapers: LocalWallpaper[];
  localWallpapersLoading: boolean;
  localWallpapersError: string | null;

  // 壁纸站
  stationCategories: WallpaperCategory[];
  stationWallpapers: RemoteWallpaper[];
  selectedCategoryId: string | null;
  stationLoading: boolean;
  stationError: string | null;
  stationPage: number;
  stationHasMore: boolean;

  // 预览状态
  previewState: WallpaperPreviewState;

  // 选中状态（用于批量操作）
  selectedWallpaperIds: Set<string>;

  // 设置壁纸状态
  settingWallpaper: boolean;
  settingWallpaperError: string | null;

  // 操作方法
  loadLocalWallpapers: () => Promise<void>;
  importWallpapers: (filePaths: string[]) => Promise<LocalWallpaper[]>;
  deleteLocalWallpaper: (id: string) => Promise<void>;
  deleteLocalWallpapers: (ids: string[]) => Promise<void>;

  loadStationCategories: () => Promise<void>;
  loadStationWallpapers: (categoryId?: string, append?: boolean) => Promise<void>;
  selectCategory: (categoryId: string | null) => void;

  openPreview: (wallpaper: RemoteWallpaper | LocalWallpaper, images: (RemoteWallpaper | LocalWallpaper)[], index: number) => void;
  closePreview: () => void;
  navigatePreview: (direction: 'prev' | 'next') => void;

  setWallpaper: (wallpaperId: string, fitMode?: WallpaperFitMode) => Promise<boolean>;
  setLocalWallpaper: (filePath: string, fitMode?: WallpaperFitMode) => Promise<boolean>;

  toggleSelectWallpaper: (id: string) => void;
  selectAllWallpapers: () => void;
  clearSelection: () => void;

  clearError: () => void;
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set, get) => ({
      // ============================================
      // 显示模式状态
      // ============================================
      displayMode: 'local',
      setDisplayMode: (mode) => set({ displayMode: mode }),

      // ============================================
      // 本地壁纸状态
      // ============================================
      localWallpapers: [],
      localWallpapersLoading: false,
      localWallpapersError: null,

      loadLocalWallpapers: async () => {
        set({ localWallpapersLoading: true, localWallpapersError: null });
        try {
          const wallpapers = await wallpaperApi.getLocalWallpapers();
          set({ localWallpapers: wallpapers, localWallpapersLoading: false });
        } catch (error) {
          set({ localWallpapersError: String(error), localWallpapersLoading: false });
        }
      },

      importWallpapers: async (filePaths) => {
        set({ localWallpapersLoading: true, localWallpapersError: null });
        try {
          console.log('[wallpaperStore] 开始导入，文件数量:', filePaths.length);
          const imported = await wallpaperApi.importWallpapers(filePaths);
          console.log('[wallpaperStore] 导入完成，返回数量:', imported.length);
          set((state) => ({
            localWallpapers: [...imported, ...state.localWallpapers],
            localWallpapersLoading: false,
          }));
          return imported;
        } catch (error) {
          set({ localWallpapersError: String(error), localWallpapersLoading: false });
          throw error;
        }
      },

      deleteLocalWallpaper: async (id) => {
        try {
          await wallpaperApi.deleteLocalWallpaper(id);
          set((state) => ({
            localWallpapers: state.localWallpapers.filter((w) => w.id !== id),
            selectedWallpaperIds: (() => {
              const newSet = new Set(state.selectedWallpaperIds);
              newSet.delete(id);
              return newSet;
            })(),
          }));
        } catch (error) {
          set({ localWallpapersError: String(error) });
          throw error;
        }
      },

      deleteLocalWallpapers: async (ids) => {
        try {
          await wallpaperApi.deleteLocalWallpapers(ids);
          set((state) => ({
            localWallpapers: state.localWallpapers.filter((w) => !ids.includes(w.id)),
            selectedWallpaperIds: (() => {
              const newSet = new Set(state.selectedWallpaperIds);
              ids.forEach((id) => newSet.delete(id));
              return newSet;
            })(),
          }));
        } catch (error) {
          set({ localWallpapersError: String(error) });
          throw error;
        }
      },

      // ============================================
      // 壁纸站状态
      // ============================================
      stationCategories: [],
      stationWallpapers: [],
      selectedCategoryId: null,
      stationLoading: false,
      stationError: null,
      stationPage: 1,
      stationHasMore: true,

      loadStationCategories: async () => {
        if (get().stationCategories.length > 0) return;
        try {
          const categories = await wallpaperApi.getWallpaperCategories();
          set({ stationCategories: categories });
        } catch (error) {
          set({ stationError: String(error) });
        }
      },

      loadStationWallpapers: async (categoryId, append = false) => {
        const state = get();
        set({ stationLoading: true, stationError: null });

        const page = append ? state.stationPage + 1 : 1;

        try {
          const response = await wallpaperApi.getWallpaperStationWallpapers(
            categoryId || state.selectedCategoryId || undefined,
            page
          );

          set((prevState) => ({
            stationWallpapers: append
              ? [...prevState.stationWallpapers, ...response.wallpapers]
              : response.wallpapers,
            stationPage: page,
            stationHasMore: response.has_more,
            stationLoading: false,
          }));
        } catch (error) {
          set({ stationError: String(error), stationLoading: false });
        }
      },

      selectCategory: (categoryId) => {
        set({ selectedCategoryId: categoryId, stationPage: 1, stationWallpapers: [] });
        get().loadStationWallpapers(categoryId || undefined);
      },

      // ============================================
      // 预览状态
      // ============================================
      previewState: {
        isOpen: false,
        currentWallpaper: null,
        currentIndex: 0,
        playlist: [],
      },

      openPreview: (wallpaper: RemoteWallpaper | LocalWallpaper, images: (RemoteWallpaper | LocalWallpaper)[], index: number) => {
        set({
          previewState: {
            isOpen: true,
            currentWallpaper: wallpaper,
            currentIndex: index,
            playlist: images,
          },
        });
      },

      closePreview: () => {
        set((state) => ({
          previewState: { ...state.previewState, isOpen: false },
        }));
      },

      navigatePreview: (direction) => {
        set((state) => {
          const { currentIndex, playlist } = state.previewState;
          const len = playlist.length;
          let newIndex = currentIndex;

          if (direction === 'prev') {
            newIndex = currentIndex <= 0 ? len - 1 : currentIndex - 1;
          } else {
            newIndex = currentIndex >= len - 1 ? 0 : currentIndex + 1;
          }

          return {
            previewState: {
              ...state.previewState,
              currentIndex: newIndex,
              currentWallpaper: playlist[newIndex],
            },
          };
        });
      },

      // ============================================
      // 设置壁纸状态
      // ============================================
      settingWallpaper: false,
      settingWallpaperError: null,

      setWallpaper: async (wallpaperId, fitMode) => {
        set({ settingWallpaper: true, settingWallpaperError: null });
        try {
          const result = await wallpaperApi.setWallpaper(wallpaperId, fitMode);
          set({ settingWallpaper: false });
          return result.success;
        } catch (error) {
          set({ settingWallpaperError: String(error), settingWallpaper: false });
          return false;
        }
      },

      setLocalWallpaper: async (filePath, fitMode) => {
        set({ settingWallpaper: true, settingWallpaperError: null });
        try {
          const result = await wallpaperApi.setLocalWallpaper(filePath, fitMode);
          set({ settingWallpaper: false });
          return result.success;
        } catch (error) {
          set({ settingWallpaperError: String(error), settingWallpaper: false });
          return false;
        }
      },

      // ============================================
      // 选中状态
      // ============================================
      selectedWallpaperIds: new Set(),

      toggleSelectWallpaper: (id) => {
        set((state) => {
          const newSet = new Set(state.selectedWallpaperIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedWallpaperIds: newSet };
        });
      },

      selectAllWallpapers: () => {
        const state = get();
        const ids = new Set(state.localWallpapers.map((w) => w.id));
        set({ selectedWallpaperIds: ids });
      },

      clearSelection: () => {
        set({ selectedWallpaperIds: new Set() });
      },

      // ============================================
      // 错误处理
      // ============================================
      clearError: () => {
        set({
          localWallpapersError: null,
          stationError: null,
          settingWallpaperError: null,
        });
      },
    }),
    {
      name: 'wallpaper-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        displayMode: state.displayMode,
        selectedCategoryId: state.selectedCategoryId,
      }),
    }
  )
);
