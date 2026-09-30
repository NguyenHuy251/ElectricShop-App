import { api } from './api';
import type {
  ApiResponse,
  CategorySpecification,
  Specification,
  SpecificationGroup,
} from '../types';

export const specificationApi = {
  // Spec Groups
  getGroups: async () => {
    const res = await api.get<ApiResponse<SpecificationGroup[]>>('/thong-so/nhom');
    return res.data.data;
  },
  createGroup: async (data: { ten_nhom_thong_so: string; thu_tu_hien_thi?: number }) => {
    const res = await api.post<ApiResponse<{ ma_nhom_thong_so: number }>>('/thong-so/nhom', data);
    return res.data.data;
  },
  updateGroup: async (
    id: number,
    data: { ten_nhom_thong_so?: string; thu_tu_hien_thi?: number; trang_thai?: boolean }
  ) => {
    const res = await api.put<ApiResponse<unknown>>(`/thong-so/nhom/${id}`, data);
    return res.data;
  },

  // Specifications
  getAll: async (params?: { ma_nhom_thong_so?: number; ma_danh_muc?: number }) => {
    const res = await api.get<ApiResponse<Specification[]>>('/thong-so', { params });
    return res.data.data;
  },
  create: async (data: {
    ma_nhom_thong_so: number;
    ten_thong_so: string;
    kieu_du_lieu?: string;
    don_vi?: string | null;
    cho_phep_loc?: boolean;
    thu_tu_hien_thi?: number;
    ma_danh_muc?: number;
    bat_buoc?: boolean;
  }) => {
    const res = await api.post<ApiResponse<{ ma_thong_so: number }>>('/thong-so', data);
    return res.data.data;
  },
  update: async (
    id: number,
    data: {
      ma_nhom_thong_so?: number;
      ten_thong_so?: string;
      kieu_du_lieu?: string;
      don_vi?: string | null;
      cho_phep_loc?: boolean;
      thu_tu_hien_thi?: number;
      trang_thai?: boolean;
    }
  ) => {
    const res = await api.put<ApiResponse<unknown>>(`/thong-so/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete<ApiResponse<{ softDeleted: boolean }>>(`/thong-so/${id}`);
    return res.data;
  },

  // Category Specifications Mapping (danh_muc_thong_so)
  getByCategory: async (categoryId: number) => {
    const res = await api.get<ApiResponse<CategorySpecification[]>>(`/danh-muc/${categoryId}/thong-so`);
    return res.data.data;
  },
  addToCategory: async (
    categoryId: number,
    data: { ma_thong_so: number; bat_buoc?: boolean; thu_tu_hien_thi?: number }
  ) => {
    const res = await api.post<ApiResponse<CategorySpecification[]>>(`/danh-muc/${categoryId}/thong-so`, data);
    return res.data.data;
  },
  updateInCategory: async (
    categoryId: number,
    specId: number,
    data: { bat_buoc?: boolean; thu_tu_hien_thi?: number }
  ) => {
    const res = await api.put<ApiResponse<unknown>>(`/danh-muc/${categoryId}/thong-so/${specId}`, data);
    return res.data;
  },
  removeFromCategory: async (categoryId: number, specId: number) => {
    const res = await api.delete<ApiResponse<unknown>>(`/danh-muc/${categoryId}/thong-so/${specId}`);
    return res.data;
  },
};
