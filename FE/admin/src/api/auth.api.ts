import { api } from './api';

export const authApi = {
  login: (payload: { ten_dang_nhap: string; mat_khau: string }) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
};
