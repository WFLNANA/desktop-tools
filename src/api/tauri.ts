// Tauri API 封装
import { invoke } from '@tauri-apps/api/core';

export const tauriApi = {
  // 占位函数，后续会添加具体的 API 调用
  async testConnection(): Promise<string> {
    return invoke('test_connection');
  },
};
