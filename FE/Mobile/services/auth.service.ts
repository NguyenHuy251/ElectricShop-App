import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const authService = {
  login: async (ten_dang_nhap: string, mat_khau: string) => {
    const response = await api.post('/auth/login', { ten_dang_nhap, mat_khau });
    const { token, user } = response.data.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  register: async (payload: Record<string, any>) => {
    const response = await api.post('/auth/register', payload);
    const { token, user } = response.data.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateMe: async (payload: { ho_ten: string; email: string; so_dien_thoai?: string; dia_chi?: string }) => {
    const response = await api.put('/auth/me', payload);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
};
