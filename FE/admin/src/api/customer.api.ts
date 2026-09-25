import { resourceApi } from './resource';
import type { User } from '../types';
const resource = resourceApi<User>('/tai-khoan');
export const customerApi = { list: resource.list, get: resource.get, update: resource.update, remove: resource.remove };
