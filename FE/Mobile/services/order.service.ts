import api from './api';

export const orderService = {
  createOrder: async (payload: Record<string, any>) => {
    const response = await api.post('/don-hang', payload);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/don-hang');
    return response.data;
  },
  getOrderById: async (id: number) => {
    const response = await api.get(`/don-hang/${id}`);
    return response.data;
  },
};
