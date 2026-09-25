import { callProcedure, firstResult } from './procedure.service.js';

export const danhMucProcedures = {
  list: 'sp_danh_muc_list',
  getById: 'sp_danh_muc_get_by_id',
  create: 'sp_danh_muc_create',
  update: 'sp_danh_muc_update',
  remove: 'sp_danh_muc_delete',
} as const;

export const danhMucService = {
  list: () => callProcedure(danhMucProcedures.list).then(firstResult),
  getById: (id: number) => callProcedure(danhMucProcedures.getById, [id]).then(firstResult),
  create: (params: unknown[]) => callProcedure(danhMucProcedures.create, params).then(firstResult),
  update: (params: unknown[]) => callProcedure(danhMucProcedures.update, params).then(firstResult),
  remove: (id: number) => callProcedure(danhMucProcedures.remove, [id]).then(firstResult),
};
