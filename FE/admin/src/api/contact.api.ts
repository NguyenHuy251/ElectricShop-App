import { resourceApi } from './resource';
import type { Contact } from '../types';
export const contactApi = resourceApi<Contact>('/lien-he');
