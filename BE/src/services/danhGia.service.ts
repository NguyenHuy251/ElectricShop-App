import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const danhGiaProcedures = {
  list: 'sp_danh_gia_list',
  listByProduct: 'sp_danh_gia_list_by_product',
  create: 'sp_danh_gia_create',
  update: 'sp_danh_gia_update',
  remove: 'sp_danh_gia_delete',
} as const;

export async function listDanhGia(params: unknown[]) {
  const resultSets = await callProcedure(danhGiaProcedures.list, params);
  return { count: firstResult(resultSets), rows: secondResult(resultSets) };
}

export const danhGiaService = {
  listByProduct: (id: number) => callProcedure(danhGiaProcedures.listByProduct, [id]).then(firstResult),
  getById: (id: number) => callProcedure('sp_danh_gia_get_by_id', [id]).then(firstResult),
  create: (params: unknown[]) => callProcedure(danhGiaProcedures.create, params).then(firstResult),
  update: (params: unknown[]) => callProcedure(danhGiaProcedures.update, params).then(firstResult),
  remove: (id: number) => callProcedure(danhGiaProcedures.remove, [id]).then(firstResult),
};
