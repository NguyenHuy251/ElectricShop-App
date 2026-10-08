import { api } from './api';
import type { ApiResponse, User } from '../types';

export const authApi = {
  login: (payload: { ten_dang_nhap: string; mat_khau: string }) => api.post<ApiResponse<{ token: string; refresh_token?:string; user: User }>>('/auth/login', payload),
  logout: (refresh_token:string)=>api.post('/auth/logout',{refresh_token}),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};
