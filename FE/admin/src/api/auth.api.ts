import { api } from './api';
import type { ApiResponse, User } from '../types';

export const authApi = {
  login: (payload: { ten_dang_nhap: string; mat_khau: string }) => api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', payload),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};
