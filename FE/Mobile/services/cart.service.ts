import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/gio-hang');
    return response.data;
  },
  addToCart: async (ma_san_pham: number, so_luong = 1, ma_bien_the?: number | null) => {
    const response = await api.post('/gio-hang', { ma_san_pham, so_luong, ma_bien_the });
    return response.data;
  },
  updateCartItem: async (ma_san_pham: number, so_luong: number, ma_bien_the?: number | null) => {
    const response = await api.put(`/gio-hang/${ma_san_pham}`, { so_luong, ma_bien_the });
    return response.data;
  },
  removeCartItem: async (ma_san_pham: number, ma_bien_the?: number | null) => {
    const response = await api.delete(`/gio-hang/${ma_san_pham}`, { params: { ma_bien_the } });
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/gio-hang');
    return response.data;
  },
};
