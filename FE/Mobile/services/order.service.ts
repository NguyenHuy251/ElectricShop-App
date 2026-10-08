import api from './api';
import type { CheckoutPayload, CheckoutQuote, CheckoutSelection } from '../types';

export const orderService = {
  getCheckout: async (selection: CheckoutSelection = {}): Promise<{ data: CheckoutQuote }> => {
    const response = await api.get('/don-hang/checkout', { params: selection });
    return response.data;
  },
  createOrder: async (payload: CheckoutPayload) => {
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
  cancelOrder: async (id: number) => {
    const response = await api.put(`/don-hang/${id}/huy`);
    return response.data;
  },
  confirmReceipt: async (id: number) => {
    const response = await api.put(`/don-hang/${id}/xac-nhan-nhan-hang`);
    return response.data;
  },
};
