import { invoke } from '@tauri-apps/api/core';
import type { SystemInfo } from '../types';

/**
 * 获取系统信息快照
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke('get_system_info');
}

export const systemInfoApi = {
  getSystemInfo,
};
