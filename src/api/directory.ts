import { invoke } from '@tauri-apps/api/core';
import type { DirectoryBinding, ResourceItem } from '../types';

export interface BatchRenameResult {
  success: string[];
  failed: string[];
}

export interface ScanProgress {
  total_files: number;
  scanned_files: number;
  current_batch: ResourceItem[];
  is_complete: boolean;
}

export const directoryApi = {
  async bindDirectory(categoryId: number, path: string): Promise<DirectoryBinding> {
    return invoke('bind_directory', { categoryId, path });
  },

  async unbindDirectory(bindingId: number): Promise<void> {
    return invoke('unbind_directory', { bindingId });
  },

  async getBindings(categoryId: number): Promise<DirectoryBinding[]> {
    return invoke('get_bindings', { categoryId });
  },

  async scanDirectory(categoryId: number, showHidden: boolean, ignoreDirectories?: string): Promise<ResourceItem[]> {
    return invoke('scan_directory', { categoryId, showHidden, ignoreDirectories });
  },

  async scanDirectoryBatch(
    categoryId: number,
    showHidden: boolean,
    ignoreDirectories?: string,
    batchSize?: number
  ): Promise<ScanProgress> {
    return invoke('scan_directory_batch', { categoryId, showHidden, ignoreDirectories, batchSize });
  },

  async selectDirectory(): Promise<string | null> {
    return invoke('select_directory');
  },

  async openInExplorer(path: string): Promise<void> {
    return invoke('open_in_explorer', { path });
  },

  async openFileLocation(filePath: string): Promise<void> {
    return invoke('open_file_location', { filePath });
  },

  async batchRenameFiles(filePaths: string[], newName: string): Promise<BatchRenameResult> {
    return invoke('batch_rename_files', { filePaths, newName });
  },
};
