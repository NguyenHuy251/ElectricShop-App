import { callProcedure, firstResult, secondResult } from './procedure.service.js';

export const nhanVienProcedures = {
  list: 'sp_nhan_vien_list',
  getById: 'sp_nhan_vien_get_by_id',
  validateAccount: 'sp_nhan_vien_validate_account',
  create: 'sp_nhan_vien_create',
  update: 'sp_nhan_vien_update',
  remove: 'sp_nhan_vien_delete',
} as const;

export async function listNhanVien() {
  return firstResult(await callProcedure(nhanVienProcedures.list));
}

export async function getNhanVienById(id: number) {
  return firstResult(await callProcedure(nhanVienProcedures.getById, [id]));
}

export async function validateNhanVienAccount(accountId: number, employeeId = 0) {
  const resultSets = await callProcedure(nhanVienProcedures.validateAccount, [accountId, employeeId]);
  return { accounts: firstResult(resultSets), employees: secondResult(resultSets) };
}

export async function createNhanVien(params: unknown[]) {
  return firstResult(await callProcedure(nhanVienProcedures.create, params));
}

export async function updateNhanVien(params: unknown[]) {
  return firstResult(await callProcedure(nhanVienProcedures.update, params));
}

export async function deleteNhanVien(id: number) {
  return firstResult(await callProcedure(nhanVienProcedures.remove, [id]));
}
