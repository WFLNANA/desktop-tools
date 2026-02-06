import { create } from 'zustand';
import type { Category, CategoryNode, CreateCategoryRequest, UpdateCategoryRequest, DeleteStrategy } from '../types';
import { categoryApi } from '../api/category';

interface CategoryStore {
  categories: CategoryNode[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadCategories: () => Promise<void>;
  createCategory: (req: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: number, req: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: number, strategy: DeleteStrategy) => Promise<void>;
  selectCategory: (category: Category | null) => void;
  reorderCategories: (orders: Array<[number, number]>) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  loadCategories: async () => {
    console.log('Loading categories...');
    set({ loading: true, error: null });
    try {
      const categories = await categoryApi.getCategories();
      console.log('Categories loaded:', categories);
      set({ categories, loading: false });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  createCategory: async (req: CreateCategoryRequest) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.createCategory(req);
      await get().loadCategories();
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  updateCategory: async (id: number, req: UpdateCategoryRequest) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.updateCategory(id, req);
      await get().loadCategories();
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  deleteCategory: async (id: number, strategy: DeleteStrategy) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.deleteCategory(id, strategy);
      await get().loadCategories();
      // 如果删除的是当前选中的分类，清除选中状态
      if (get().selectedCategory?.id === id) {
        set({ selectedCategory: null });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  selectCategory: (category: Category | null) => {
    set({ selectedCategory: category });
  },

  reorderCategories: async (orders: Array<[number, number]>) => {
    set({ loading: true, error: null });
    try {
      await categoryApi.reorderCategories(orders);
      await get().loadCategories();
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },
}));
