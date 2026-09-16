import api from './api';

export const productService = {
  getProducts: async (params?: Record<string, any>) => {
    const response = await api.get('/san-pham', { params });
    return response.data;
  },
  getProductById: async (id: number) => {
    const response = await api.get(`/san-pham/${id}`);
    return response.data;
  },
};
