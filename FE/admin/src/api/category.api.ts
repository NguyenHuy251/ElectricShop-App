import { resourceApi } from './resource';
import type { Category } from '../types';
export const categoryApi = resourceApi<Category>('/danh-muc');
