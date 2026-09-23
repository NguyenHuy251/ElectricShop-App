import { resourceApi } from './resource';
import type { Product, ProductInput } from '../types';
import { api } from './api';
export const productApi = { ...resourceApi<Product>('/san-pham'), create: (payload: ProductInput) => api.post('/san-pham', payload), update: (id: number, payload: ProductInput) => api.put(`/san-pham/${id}`, payload) };
