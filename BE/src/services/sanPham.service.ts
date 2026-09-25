import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const sanPhamProcedures = {
  list: 'sp_san_pham_list',
  getById: 'sp_san_pham_get_by_id',
  create: 'sp_san_pham_create',
  update: 'sp_san_pham_update',
  remove: 'sp_san_pham_delete',
} as const;

export async function listSanPham(params: unknown[]) {
  const resultSets = await callProcedure(sanPhamProcedures.list, params);
  return { count: firstResult(resultSets), rows: secondResult(resultSets) };
}

export async function getSanPhamById(id: number) {
  return firstResult(await callProcedure(sanPhamProcedures.getById, [id]));
}

export async function findSanPhamByCode(code: string) {
  return firstResult(await callProcedure('sp_san_pham_find_by_code', [code]));
}

export async function createSanPham(params: unknown[]) {
  return firstResult(await callProcedure(sanPhamProcedures.create, params));
}

export async function updateSanPham(params: unknown[]) {
  return firstResult(await callProcedure(sanPhamProcedures.update, params));
}

export async function deleteSanPham(id: number) {
  return firstResult(await callProcedure(sanPhamProcedures.remove, [id]));
}
