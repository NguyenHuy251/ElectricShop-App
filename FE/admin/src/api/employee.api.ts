import { resourceApi } from './resource';
import type { Employee } from '../types';
const resource = resourceApi<Employee>('/nhan-vien');
export const employeeApi = { ...resource, update: (id: number, payload: Partial<Employee>) => resource.update(id, { ...payload, ma_tai_khoan: payload.ma_tai_khoan ?? null }) };
