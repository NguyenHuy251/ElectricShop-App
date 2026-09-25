import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const gioHangProcedures = {
  get: 'sp_gio_hang_get',
  addItem: 'sp_gio_hang_add_item',
  updateItem: 'sp_gio_hang_update_item',
  removeItem: 'sp_gio_hang_delete_item',
  clear: 'sp_gio_hang_clear',
} as const;

export async function getGioHangData(accountId: number) {
  const resultSets = await callProcedure(gioHangProcedures.get, [accountId]);
  return { cart: firstResult(resultSets), items: secondResult(resultSets) };
}

export const gioHangService = {
  addItem: (params: unknown[]) => callProcedure(gioHangProcedures.addItem, params).then(firstResult),
  updateItem: (params: unknown[]) => callProcedure(gioHangProcedures.updateItem, params).then(firstResult),
  removeItem: (params: unknown[]) => callProcedure(gioHangProcedures.removeItem, params).then(firstResult),
  clear: (accountId: number) => callProcedure(gioHangProcedures.clear, [accountId]).then(firstResult),
};
