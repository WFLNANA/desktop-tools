import { invoke } from '@tauri-apps/api/core';
import type {
  EnvironmentVariable,
  CreateEnvVarRequest,
  UpdateEnvVarRequest,
  EnvVarCategory,
} from '../types';

export const envVarApi = {
  async getEnvironmentVariables(): Promise<EnvironmentVariable[]> {
    return invoke('get_env_vars');
  },

  async getEnvVarCategories(): Promise<EnvVarCategory[]> {
    return invoke('get_env_var_categories');
  },

  async createEnvVar(req: CreateEnvVarRequest): Promise<EnvironmentVariable> {
    return invoke('create_env_var', { req });
  },

  async updateEnvVar(id: string, req: UpdateEnvVarRequest): Promise<EnvironmentVariable> {
    return invoke('update_env_var', { id, req });
  },

  async deleteEnvVar(id: string): Promise<void> {
    return invoke('delete_env_var', { id });
  },

  async deleteEnvVars(ids: string[]): Promise<void> {
    return invoke('delete_env_vars', { ids });
  },

  async syncEnvVar(id: string): Promise<EnvironmentVariable> {
    return invoke('sync_env_var', { id });
  },

  async syncAllEnvVars(): Promise<EnvironmentVariable[]> {
    return invoke('sync_all_env_vars');
  },

  async validateEnvVarName(name: string): Promise<{ valid: boolean; error?: string }> {
    return invoke('validate_env_var_name', { name });
  },

  async openEnvVarSettings(): Promise<void> {
    return invoke('open_env_var_settings');
  },
};
