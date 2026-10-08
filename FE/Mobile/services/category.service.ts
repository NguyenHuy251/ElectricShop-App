import api from './api';

export interface Category {
  ma_danh_muc: number;
  ten_danh_muc: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/danh-muc', { params: { has_products: true } });
    return response.data.data || [];
  },
};
