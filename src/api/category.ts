/*
 * @Author       : wfl
 * @LastEditors  : wfl
 * @description  : 
 * @updateInfo   : 
 * @Date         : 2026-01-22 21:08:29
 * @LastEditTime : 2026-01-22 21:25:14
 */
import { invoke } from '@tauri-apps/api/core';
import type {
  Category,
  CategoryNode,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteStrategy,
} from '../types';

export const categoryApi = {
  async getCategories(): Promise<CategoryNode[]> {
    return invoke('get_category_tree');
  },

  async createCategory(req: CreateCategoryRequest): Promise<Category> {
    return invoke('create_category', { req });
  },

  async updateCategory(id: number, req: UpdateCategoryRequest): Promise<Category> {
    return invoke('update_category', { id, req });
  },

  async deleteCategory(id: number, strategy: DeleteStrategy): Promise<void> {
    return invoke('delete_category', { id, strategy });
  },

  async reorderCategories(orders: Array<[number, number]>): Promise<void> {
    return invoke('reorder_categories', { orders });
  },
};
