import { callProcedure, firstResult } from './procedure.service.js';

export const taiKhoanProcedures = {
  list: 'sp_tai_khoan_list',
  getById: 'sp_tai_khoan_get_by_id',
  findByEmail: 'sp_tai_khoan_find_by_email',
  update: 'sp_tai_khoan_update',
  remove: 'sp_tai_khoan_delete',
} as const;

export const taiKhoanService = {
  list: () => callProcedure(taiKhoanProcedures.list).then(firstResult),
  getById: (id: number) => callProcedure(taiKhoanProcedures.getById, [id]).then(firstResult),
  findByEmail: (email: string, excludeId: number) => callProcedure(taiKhoanProcedures.findByEmail, [email, excludeId]).then(firstResult),
  update: (params: unknown[]) => callProcedure(taiKhoanProcedures.update, params).then(firstResult),
  remove: (id: number) => callProcedure(taiKhoanProcedures.remove, [id]).then(firstResult),
};
