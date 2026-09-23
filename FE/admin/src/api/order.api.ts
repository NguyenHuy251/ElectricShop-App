import { resourceApi } from './resource';
import { api } from './api';
import type { Order } from '../types';
export const orderApi = { ...resourceApi<Order>('/don-hang'), status: (id: number, trang_thai: Order['trang_thai']) => api.put(`/don-hang/${id}/trang-thai`, { trang_thai }) };
