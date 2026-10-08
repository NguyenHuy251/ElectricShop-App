import { callProcedure, firstResult, secondResult } from './procedure.service.js';
import { pool } from '../config/database.js';
import { parseJsonField } from './sanPham.service.js';

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
  const items = secondResult(resultSets);
  const productIds = [...new Set(items.map(item => item.ma_san_pham))];
  const products = new Map<unknown, any>();
  const specs = new Map<unknown, any[]>();
  const variants = new Map<unknown, any>();
  if (productIds.length) {
    const [rows] = await pool.query(`SELECT p.ma_san_pham,p.ma_san_pham_code,p.bao_hanh,
      dm.ten_danh_muc,th.ten_thuong_hieu,
      COALESCE(NULLIF(p.hinh_anh,''), (
        SELECT h.duong_dan FROM hinh_anh_san_pham h WHERE h.ma_san_pham=p.ma_san_pham
        ORDER BY h.la_anh_chinh DESC,h.thu_tu_hien_thi,h.ma_hinh_anh LIMIT 1
      )) AS hinh_anh FROM san_pham p
      LEFT JOIN danh_muc dm ON dm.ma_danh_muc=p.ma_danh_muc
      LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu=p.ma_thuong_hieu
      WHERE p.ma_san_pham IN (?)`, [productIds]);
    for (const row of rows as any[]) products.set(row.ma_san_pham, row);
    const [specRows] = await pool.query(`SELECT p.ma_san_pham,ts.ma_thong_so,ts.ten_thong_so,ts.don_vi,
      tsp.gia_tri,tsp.gia_tri_so,tsp.gia_tri_bool
      FROM san_pham p JOIN danh_muc_thong_so dmts ON dmts.ma_danh_muc=p.ma_danh_muc
      JOIN thong_so ts ON ts.ma_thong_so=dmts.ma_thong_so
      LEFT JOIN thong_so_san_pham tsp ON tsp.ma_san_pham=p.ma_san_pham AND tsp.ma_thong_so=ts.ma_thong_so
      WHERE p.ma_san_pham IN (?) ORDER BY dmts.thu_tu_hien_thi,ts.thu_tu_hien_thi,ts.ma_thong_so`, [productIds]);
    for (const row of specRows as any[]) specs.set(row.ma_san_pham, [...(specs.get(row.ma_san_pham) || []), row]);
    const variantIds = items.map(item => item.ma_bien_the).filter(Boolean);
    if (variantIds.length) {
      const [variantRows] = await pool.query('SELECT ma_bien_the,ma_san_pham,ma_sku,thong_so_json FROM san_pham_bien_the WHERE ma_bien_the IN (?)', [variantIds]);
      for (const row of variantRows as any[]) variants.set(row.ma_bien_the, row);
    }
  }
  return { order: await withPaymentDetails(firstResult(resultSets)), items: items.map(item => {
    const product = products.get(item.ma_san_pham);
    const candidate = variants.get(item.ma_bien_the);
    const variant = candidate?.ma_san_pham === item.ma_san_pham ? candidate : undefined;
    const overrides = parseJsonField<any[]>(variant?.thong_so_json, []);
    const merged = new Map((specs.get(item.ma_san_pham) || []).map(spec => [Number(spec.ma_thong_so), spec]));
    if (Array.isArray(overrides)) for (const spec of overrides) {
      if (!spec || !Number.isInteger(Number(spec.ma_thong_so))) continue;
      const base = merged.get(Number(spec.ma_thong_so));
      // Replace all values so a numeric/boolean override cannot retain base text.
      merged.set(Number(spec.ma_thong_so), { ...base, ...spec,
        gia_tri: spec.gia_tri ?? null, gia_tri_so: spec.gia_tri_so ?? null, gia_tri_bool: spec.gia_tri_bool ?? null });
    }
    const specifications = [...merged.values()].flatMap(spec => {
      const value = spec.gia_tri ?? spec.gia_tri_so ?? (spec.gia_tri_bool == null ? null : Number(spec.gia_tri_bool) ? 'Có' : 'Không');
      if (value == null || String(value).trim() === '') return [];
      const unit = String(spec.don_vi || '').trim();
      const display = String(value).trim();
      return [{ ma_thong_so: Number(spec.ma_thong_so), ten_thong_so: spec.ten_thong_so || `Thông số #${spec.ma_thong_so}`,
        gia_tri: unit && !display.toLowerCase().endsWith(unit.toLowerCase()) ? `${display} ${unit}` : display }];
    });
    return { ...item, hinh_anh: item.hinh_anh || product?.hinh_anh || null,
      product_details: product ? { ma_san_pham_code: product.ma_san_pham_code, ma_sku: variant?.ma_sku || null,
        ten_danh_muc: product.ten_danh_muc, ten_thuong_hieu: product.ten_thuong_hieu,
        bao_hanh: product.bao_hanh, thong_so_ky_thuat: specifications } : null };
  }) };
}

export const donHangService = {
  updateStatus: (params: unknown[]) => callProcedure(donHangProcedures.updateStatus, params).then(firstResult),
  cancel: (params: unknown[]) => callProcedure(donHangProcedures.cancel, params).then(firstResult),
  remove: (id: number) => callProcedure(donHangProcedures.remove, [id]).then(firstResult),
};
