import api from './api';

export type ContactPayload = {
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  tieu_de: string;
  noi_dung: string;
};

export const contactService = {
  create: (payload: ContactPayload) => api.post('/lien-he', payload),
  getMine: () => api.get('/lien-he/cua-toi'),
};
