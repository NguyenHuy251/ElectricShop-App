import api from './api';
import type { Product, ProductReview } from '../types';

export const productService = {
  updateReview: async (id: number, payload: { so_sao: number; noi_dung: string }) => {
    const response = await api.put(`/danh-gia/${id}`, payload);
    return response.data;
  },
  createReview: async (payload: { ma_don_hang: number; ma_san_pham: number; so_sao: number; noi_dung: string }): Promise<{ data: { ma_danh_gia: number } }> => {
    const response = await api.post('/danh-gia', payload);
    return response.data;
  },
  getProducts: async (params?: Record<string, any>) => {
    const response = await api.get('/san-pham', { params });
    return response.data;
  },
  getProductById: async (id: number) => {
    const response = await api.get(`/san-pham/${id}`);
    const product = response.data.data;
    if (typeof product?.chi_tiet_san_pham === 'string') {
      try { product.chi_tiet_san_pham = JSON.parse(product.chi_tiet_san_pham); }
      catch { product.chi_tiet_san_pham = null; }
    }
    return response.data as { data: Product };
  },
  getReviews: async (id: number): Promise<{ data: ProductReview[] }> => {
    const response = await api.get(`/danh-gia/san-pham/${id}`);
    return response.data;
  },
};
