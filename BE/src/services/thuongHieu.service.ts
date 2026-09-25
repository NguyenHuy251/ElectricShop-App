import { callProcedure, firstResult } from './procedure.service.js';

export const thuongHieuProcedures = {
  list: 'sp_thuong_hieu_list',
  getById: 'sp_thuong_hieu_get_by_id',
  create: 'sp_thuong_hieu_create',
  update: 'sp_thuong_hieu_update',
  remove: 'sp_thuong_hieu_delete',
} as const;

export const thuongHieuService = {
  list: () => callProcedure(thuongHieuProcedures.list).then(firstResult),
  getById: (id: number) => callProcedure(thuongHieuProcedures.getById, [id]).then(firstResult),
  create: (params: unknown[]) => callProcedure(thuongHieuProcedures.create, params).then(firstResult),
  update: (params: unknown[]) => callProcedure(thuongHieuProcedures.update, params).then(firstResult),
  remove: (id: number) => callProcedure(thuongHieuProcedures.remove, [id]).then(firstResult),
};
