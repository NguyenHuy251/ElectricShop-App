import api from './api';
import type { Product, ProductReview } from '../types';

export const productService = {
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
