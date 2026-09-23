import { resourceApi } from './resource';
import type { Review } from '../types';
export const reviewApi = resourceApi<Review>('/danh-gia');
