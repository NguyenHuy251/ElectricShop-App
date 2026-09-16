import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/gio-hang');
    return response.data;
  },
  addToCart: async (ma_san_pham: number, so_luong = 1) => {
    const response = await api.post('/gio-hang', { ma_san_pham, so_luong });
    return response.data;
  },
  updateCartItem: async (ma_san_pham: number, so_luong: number) => {
    const response = await api.put(`/gio-hang/${ma_san_pham}`, { so_luong });
    return response.data;
  },
  removeCartItem: async (ma_san_pham: number) => {
    const response = await api.delete(`/gio-hang/${ma_san_pham}`);
    return response.data;
  },
  clearCart: async () => {
    const response = await api.delete('/gio-hang');
    return response.data;
  },
};
