/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-26 16:19:54
 * @LastEditTime : 2026-01-28 10:51:21
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallpaper } from './types';

interface WallpaperState {
  activeTab: 'local' | 'online';
  setActiveTab: (tab: 'local' | 'online') => void;
  
  localWallpapers: Wallpaper[];
  addLocalWallpapers: (wallpapers: Wallpaper[]) => void;
  removeLocalWallpaper: (id: string) => void;
  topLocalWallpaper: (id: string) => void;
  
  // Settings
  layout: 'grid' | 'list';
  setLayout: (layout: 'grid' | 'list') => void;
  
  selectedWallpaper: Wallpaper | null;
  setSelectedWallpaper: (wallpaper: Wallpaper | null) => void;

  // Preview
  previewVisible: boolean;
  previewList: Wallpaper[];
  previewIndex: number;
  openPreview: (list: Wallpaper[], initialIndex: number) => void;
  closePreview: () => void;
  setPreviewIndex: (index: number) => void;
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set) => ({
      activeTab: 'local',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      localWallpapers: [],
      addLocalWallpapers: (newWallpapers) => set((state) => ({
        localWallpapers: [...state.localWallpapers, ...newWallpapers]
      })),
      removeLocalWallpaper: (id) => set((state) => ({
        localWallpapers: state.localWallpapers.filter(w => w.id !== id)
      })),
      topLocalWallpaper: (id) => set((state) => {
        const item = state.localWallpapers.find(w => w.id === id);
        if (!item) return state;
        return {
            localWallpapers: [item, ...state.localWallpapers.filter(w => w.id !== id)]
        };
      }),
      
      layout: 'grid',
      setLayout: (layout) => set({ layout }),
      
      selectedWallpaper: null,
      setSelectedWallpaper: (wallpaper) => set({ selectedWallpaper: wallpaper }),

      previewVisible: false,
      previewList: [],
      previewIndex: 0,
      openPreview: (list, initialIndex) => set({
        previewVisible: true,
        previewList: list,
        previewIndex: initialIndex,
        selectedWallpaper: list[initialIndex]
      }),
      closePreview: () => set({ previewVisible: false }),
      setPreviewIndex: (index) => set((state) => ({
        previewIndex: index,
        selectedWallpaper: state.previewList[index]
      })),
    }),
    {
      name: 'wallpaper-storage',
      partialize: (state) => ({
        localWallpapers: state.localWallpapers,
        activeTab: state.activeTab,
        layout: state.layout
      }) as unknown as WallpaperState
    }
  )
);
