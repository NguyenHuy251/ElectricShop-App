import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const donHangProcedures = {
  create: 'sp_don_hang_create',
  list: 'sp_don_hang_list',
  getById: 'sp_don_hang_get_by_id',
  updateStatus: 'sp_don_hang_update_status',
  cancel: 'sp_don_hang_cancel',
  remove: 'sp_don_hang_delete',
} as const;

export async function createDonHang(params: unknown[]) {
  return firstResult(await callProcedure(donHangProcedures.create, params));
}

export async function listDonHang(accountId: number, isCustomer: boolean) {
  const resultSets = await callProcedure(donHangProcedures.list, [accountId, isCustomer]);
  return { orders: firstResult(resultSets), items: secondResult(resultSets) };
}

export async function getDonHangById(id: number) {
  const resultSets = await callProcedure(donHangProcedures.getById, [id]);
  return { order: firstResult(resultSets), items: secondResult(resultSets) };
}

export const donHangService = {
  updateStatus: (params: unknown[]) => callProcedure(donHangProcedures.updateStatus, params).then(firstResult),
  cancel: (params: unknown[]) => callProcedure(donHangProcedures.cancel, params).then(firstResult),
  remove: (id: number) => callProcedure(donHangProcedures.remove, [id]).then(firstResult),
};
