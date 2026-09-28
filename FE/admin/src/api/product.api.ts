import { resourceApi } from './resource';
import type { ApiResponse, CategorySpecification, Product, ProductImage, ProductInput, ProductSpecification } from '../types';
import { api } from './api';

export const productApi = {
  ...resourceApi<Product>('/san-pham'),
  create: (payload: ProductInput) => api.post('/san-pham', payload),
  update: (id: number, payload: ProductInput) => api.put(`/san-pham/${id}`, payload),
  getCategorySpecifications: async (categoryId: number) =>
    (await api.get<ApiResponse<CategorySpecification[]>>(`/danh-muc/${categoryId}/thong-so`)).data.data,
  getProductSpecifications: async (productId: number) =>
    (await api.get<ApiResponse<ProductSpecification[]>>(`/san-pham/${productId}/thong-so`)).data.data,
  getProductImages: async (productId: number) =>
    (await api.get<ApiResponse<ProductImage[]>>(`/san-pham/${productId}/hinh-anh`)).data.data,
  addProductImage: async (productId: number, data: { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean }) =>
    (await api.post(`/san-pham/${productId}/hinh-anh`, data)).data,
  deleteProductImage: async (productId: number, imageId: number) =>
    (await api.delete(`/san-pham/${productId}/hinh-anh/${imageId}`)).data,
  setPrimaryImage: async (productId: number, imageId: number) =>
    (await api.put(`/san-pham/${productId}/hinh-anh/${imageId}/chinh`)).data,
};
