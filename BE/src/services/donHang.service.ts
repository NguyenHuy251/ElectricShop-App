import { callProcedure, firstResult, secondResult } from './procedure.service.js';
import { pool } from '../config/database.js';

async function withPaymentDetails(orders: unknown[]) {
  const rows = orders as { ma_don_hang: number; [key: string]: unknown }[];
  if (!rows.length) return orders;
  const [payments] = await pool.query(`SELECT ma_don_hang,ma_voucher,ma_code,giam_gia,phi_giao_hang,
    tong_tien+giam_gia-phi_giao_hang AS tam_tinh FROM don_hang WHERE ma_don_hang IN (?)`, [rows.map(row => row.ma_don_hang)]);
  const byId = new Map((payments as typeof rows).map(row => [row.ma_don_hang,row]));
  return rows.map(row => ({ ...row, ...byId.get(row.ma_don_hang) }));
}

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
  return { orders: await withPaymentDetails(firstResult(resultSets)), items: secondResult(resultSets) };
}

export async function getDonHangById(id: number) {
  const resultSets = await callProcedure(donHangProcedures.getById, [id]);
  return { order: await withPaymentDetails(firstResult(resultSets)), items: secondResult(resultSets) };
}

export const donHangService = {
  updateStatus: (params: unknown[]) => callProcedure(donHangProcedures.updateStatus, params).then(firstResult),
  cancel: (params: unknown[]) => callProcedure(donHangProcedures.cancel, params).then(firstResult),
  remove: (id: number) => callProcedure(donHangProcedures.remove, [id]).then(firstResult),
};
