import { create } from 'zustand';
import { shortcutsApi } from '../services/shortcuts';
import type { QuickAccessItem, CreateQuickAccessDto, UpdateQuickAccessDto, WebsiteMetadata } from '../types/shortcuts';
import { message } from 'antd';

interface ShortcutState {
  items: QuickAccessItem[];
  loading: boolean;
  hasPasswordSet: boolean;
  activeTab: 'website' | 'directory';
  
  // Actions
  fetchShortcuts: () => Promise<void>;
  checkPasswordStatus: () => Promise<void>;
  createShortcut: (data: CreateQuickAccessDto) => Promise<boolean>;
  updateShortcut: (id: string, data: UpdateQuickAccessDto) => Promise<boolean>;
  deleteShortcut: (id: string) => Promise<boolean>;
  openShortcut: (item: QuickAccessItem) => Promise<void>;
  fetchWebsiteMetadata: (url: string) => Promise<WebsiteMetadata>;
  setGlobalPassword: (password: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  setActiveTab: (tab: 'website' | 'directory') => void;
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  items: [],
  loading: false,
  hasPasswordSet: false,
  activeTab: 'website',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchShortcuts: async () => {
    set({ loading: true });
    try {
      // 在管理页面显示所有项目（包括隐藏的）
      const items = await shortcutsApi.getShortcuts(true);
      set({ items });
    } catch (error) {
      console.error('Failed to fetch shortcuts:', error);
      message.error('获取快捷方式列表失败');
    } finally {
      set({ loading: false });
    }
  },

  checkPasswordStatus: async () => {
    try {
      const hasPassword = await shortcutsApi.hasPassword();
      set({ hasPasswordSet: hasPassword });
    } catch (error) {
      console.error('Failed to check password status:', error);
    }
  },

  createShortcut: async (data) => {
    try {
      await shortcutsApi.createShortcut(data);
      message.success('添加成功');
      await get().fetchShortcuts();
      return true;
    } catch (error) {
      console.error('Failed to create shortcut:', error);
      message.error('添加失败');
      return false;
    }
  },

  updateShortcut: async (id, data) => {
    try {
      await shortcutsApi.updateShortcut(id, data);
      message.success('更新成功');
      await get().fetchShortcuts();
      return true;
    } catch (error) {
      console.error('Failed to update shortcut:', error);
      message.error('更新失败');
      return false;
    }
  },

  deleteShortcut: async (id) => {
    try {
      await shortcutsApi.deleteShortcut(id);
      message.success('删除成功');
      await get().fetchShortcuts();
      return true;
    } catch (error) {
      console.error('Failed to delete shortcut:', error);
      message.error('删除失败');
      return false;
    }
  },

  openShortcut: async (item) => {
    try {
      await shortcutsApi.openShortcut(item.target, item.kind);
    } catch (error) {
      console.error('Failed to open shortcut:', error);
      message.error('打开失败');
    }
  },

  fetchWebsiteMetadata: async (url) => {
    try {
      return await shortcutsApi.fetchWebsiteMetadata(url);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      // 解析失败不阻断流程，返回空对象
      return {};
    }
  },

  setGlobalPassword: async (password) => {
    try {
      await shortcutsApi.setGlobalPassword(password);
      set({ hasPasswordSet: true });
      message.success('密码设置成功');
      return true;
    } catch (error) {
      console.error('Failed to set password:', error);
      message.error('密码设置失败');
      return false;
    }
  },

  verifyPassword: async (password) => {
    try {
      return await shortcutsApi.verifyPassword(password);
    } catch (error) {
      console.error('Failed to verify password:', error);
      return false;
    }
  },
}));
