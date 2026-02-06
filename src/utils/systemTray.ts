/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-22 12:30:32
 * @LastEditTime : 2026-01-23 14:13:19
 */
import { TrayIcon } from '@tauri-apps/api/tray';

const TRAY_ID = 'main-tray';

export async function destroyTray() {
  try {
    await TrayIcon.removeById(TRAY_ID);
  } catch (error) {
    console.error('Failed to destroy system tray:', error);
  }
}

export function isTrayInitializedFunc(): boolean {
  return true;
}
