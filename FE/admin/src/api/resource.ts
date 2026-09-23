import { api } from './api';
import type { ApiResponse } from '../types';

export type Query = Record<string, string | number | undefined>;
export function resourceApi<T>(path: string) {
  return {
    list: async (params?: Query) => (await api.get<ApiResponse<T[]>>(path, { params })).data,
    get: async (id: number) => (await api.get<ApiResponse<T>>(`${path}/${id}`)).data.data,
    create: async (payload: Partial<T>) => api.post(path, payload),
    update: async (id: number, payload: Partial<T>) => api.put(`${path}/${id}`, payload),
    remove: async (id: number) => api.delete(`${path}/${id}`),
  };
}
