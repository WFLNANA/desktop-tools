import { invoke } from '@tauri-apps/api/core';
import { QuickAccessItem, CreateQuickAccessDto, UpdateQuickAccessDto, WebsiteMetadata } from '../types/shortcuts';

export const shortcutsApi = {
  getShortcuts: async (includeHidden: boolean): Promise<QuickAccessItem[]> => {
    return invoke('get_shortcuts', { includeHidden });
  },

  createShortcut: async (dto: CreateQuickAccessDto): Promise<QuickAccessItem> => {
    return invoke('create_shortcut', { dto });
  },

  updateShortcut: async (id: string, dto: UpdateQuickAccessDto): Promise<QuickAccessItem> => {
    return invoke('update_shortcut', { id, dto });
  },

  deleteShortcut: async (id: string): Promise<void> => {
    return invoke('delete_shortcut', { id });
  },

  openShortcut: async (target: string, kind: string): Promise<void> => {
    return invoke('open_shortcut', { target, kind });
  },

  setGlobalPassword: async (password: string): Promise<void> => {
    return invoke('set_global_password', { password });
  },

  verifyPassword: async (password: string): Promise<boolean> => {
    return invoke('verify_password', { password });
  },

  hasPassword: async (): Promise<boolean> => {
    return invoke('has_password');
  },

  fetchWebsiteMetadata: async (url: string): Promise<WebsiteMetadata> => {
    return invoke('fetch_website_metadata', { url });
  },
};
