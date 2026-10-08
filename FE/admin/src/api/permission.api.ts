import { api } from './api';
import type { ApiResponse, User } from '../types';
import type { Permission } from '../auth/permissions';

export interface StaffAccount extends Pick<User, 'ma_tai_khoan' | 'ho_ten' | 'ten_dang_nhap' | 'email' | 'trang_thai'> {
  permissions: Permission[];
  ma_nhan_vien?: number | null;
  chuc_vu?: string | null;
}
export interface PermissionData {
  groups: { code: Permission; name: string; description: string }[];
  presets: { name: string; permissions: Permission[] }[];
  accounts: StaffAccount[];
}
export const permissionApi = {
  list: async () => (await api.get<ApiResponse<PermissionData>>('/permissions')).data,
  save: (id: number, permissions: Permission[]) => api.put(`/permissions/${id}`, { permissions }),
};
