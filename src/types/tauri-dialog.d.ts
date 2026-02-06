declare module '@tauri-apps/api/dialog' {
  import { OpenDialogOptions, OpenDialogResult, SaveDialogOptions, SaveDialogResult, MessageDialogOptions, ConfirmDialogOptions } from '@tauri-apps/api/core';

  export interface FileDialogOptions extends OpenDialogOptions {
    filters?: { name: string; extensions: string[] }[];
    multiple?: boolean;
    defaultPath?: string;
  }

  export function open(options?: FileDialogOptions): Promise<OpenDialogResult>;
  export function save(options?: SaveDialogOptions): Promise<SaveDialogResult>;
  export function message(message: string, options?: MessageDialogOptions | ConfirmDialogOptions): Promise<string>;
  export function ask(message: string, options?: ConfirmDialogOptions): Promise<boolean>;
  export function confirm(message: string, options?: ConfirmDialogOptions): Promise<boolean>;
}
