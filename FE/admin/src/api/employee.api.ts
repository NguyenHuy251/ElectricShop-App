import { resourceApi } from './resource';
import { api } from './api';
import type { Employee } from '../types';
const resource = resourceApi<Employee>('/nhan-vien');
export const employeeApi = { ...resource,
  createAccount: (id: number, payload: { ten_dang_nhap: string; mat_khau: string; email: string }) => api.post(`/nhan-vien/${id}/account`, payload),
  update: (id: number, payload: Partial<Employee>) => resource.update(id, { ...payload, ma_tai_khoan: payload.ma_tai_khoan ?? null }) };
