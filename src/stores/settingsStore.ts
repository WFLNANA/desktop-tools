/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-22 12:06:46
 * @LastEditTime : 2026-02-05 17:21:16
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAutoStart } from '../utils/autoStart';
import { invoke } from '@tauri-apps/api/core';

export type ThemePreset = 'blue' | 'green' | 'purple';
export type CloseBehavior = 'exit' | 'minimize';

export interface SystemSettings {
  themePreset: ThemePreset;
  closeBehavior: CloseBehavior;
  autoStart: boolean;
  scanIgnoreDirectories: string;
}

interface SettingsStore extends SystemSettings {
  setThemePreset: (theme: ThemePreset) => void;
  setCloseBehavior: (behavior: CloseBehavior) => void;
  setAutoStart: (enabled: boolean) => Promise<void>;
  setScanIgnoreDirectories: (directories: string) => void;
  loadSettings: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  themePreset: 'blue',
  closeBehavior: 'exit',
  autoStart: false,
  scanIgnoreDirectories: 'node_modules,.git,dist,target',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setThemePreset: (theme) => {
        set({ themePreset: theme });
      },

      setCloseBehavior: (behavior) => {
        set({ closeBehavior: behavior });
        invoke('set_close_behavior', { behavior }).catch(console.error);
      },

      setAutoStart: async (enabled) => {
        set({ autoStart: enabled });
        await setAutoStart(enabled);
      },

      setScanIgnoreDirectories: (directories) => {
        set({ scanIgnoreDirectories: directories });
      },

      loadSettings: () => {
        const stored = get();
        set({
          themePreset: stored.themePreset || DEFAULT_SETTINGS.themePreset,
          closeBehavior: stored.closeBehavior || DEFAULT_SETTINGS.closeBehavior,
          autoStart: stored.autoStart ?? DEFAULT_SETTINGS.autoStart,
          scanIgnoreDirectories: stored.scanIgnoreDirectories ?? DEFAULT_SETTINGS.scanIgnoreDirectories,
        });
      },
    }),
    {
      name: 'system-settings',
    }
  )
);

export const THEME_PRESETS = [
  { 
    id: 'blue' as ThemePreset, 
    name: '清新蓝', 
    colors: {
      light: '#3182ce',
      dark: '#4299e1'
    },
    description: '简洁专业的蓝色主题' 
  },
  { 
    id: 'green' as ThemePreset, 
    name: '自然绿', 
    colors: {
      light: '#38a169',
      dark: '#48bb78'
    },
    description: '清新自然的绿色主题' 
  },
  { 
    id: 'purple' as ThemePreset, 
    name: '优雅紫', 
    colors: {
      light: '#805ad5',
      dark: '#9f7aea'
    },
    description: '高贵优雅的紫色主题' 
  },
] as const;
