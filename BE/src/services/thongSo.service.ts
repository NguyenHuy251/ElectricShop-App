import { pool } from '../config/database.js';
import { callProcedure, firstResult } from './procedure.service.js';
import type {
  CategorySpecification,
  ProductSpecification,
  Specification,
  SpecificationGroup,
} from '../types/index.js';

export async function listNhomThongSo(): Promise<SpecificationGroup[]> {
  const [rows] = await pool.query(
    'SELECT ma_nhom_thong_so, ten_nhom_thong_so, thu_tu_hien_thi, trang_thai FROM nhom_thong_so WHERE trang_thai = TRUE ORDER BY thu_tu_hien_thi, ma_nhom_thong_so'
  );
  return rows as SpecificationGroup[];
}

export async function listThongSo(filters?: {
  ma_nhom_thong_so?: number;
  ma_danh_muc?: number;
}): Promise<Specification[]> {
  let sql = `
    SELECT
      ts.ma_thong_so,
      ts.ma_nhom_thong_so,
      nts.ten_nhom_thong_so,
      ts.ten_thong_so,
      ts.kieu_du_lieu,
      ts.don_vi,
      ts.cho_phep_loc,
      ts.thu_tu_hien_thi,
      ts.trang_thai
    FROM thong_so ts
    JOIN nhom_thong_so nts ON nts.ma_nhom_thong_so = ts.ma_nhom_thong_so
    WHERE ts.trang_thai = TRUE
  `;
  const params: unknown[] = [];

  if (filters?.ma_nhom_thong_so) {
    sql += ' AND ts.ma_nhom_thong_so = ?';
    params.push(filters.ma_nhom_thong_so);
  }

  if (filters?.ma_danh_muc) {
    sql += `
      AND ts.ma_thong_so IN (
        SELECT ma_thong_so FROM danh_muc_thong_so WHERE ma_danh_muc = ?
      )
    `;
    params.push(filters.ma_danh_muc);
  }

  sql += ' ORDER BY nts.thu_tu_hien_thi, ts.thu_tu_hien_thi, ts.ma_thong_so';

  const [rows] = await pool.query(sql, params);
  return rows as Specification[];
}

export async function listThongSoByDanhMuc(ma_danh_muc: number): Promise<CategorySpecification[]> {
  const resultSets = await callProcedure('sp_thong_so_list_by_category', [ma_danh_muc]);
  return firstResult(resultSets) as unknown as CategorySpecification[];
}

export async function getThongSoBySanPham(ma_san_pham: number): Promise<ProductSpecification[]> {
  const resultSets = await callProcedure('sp_thong_so_get_by_product', [ma_san_pham]);
  return firstResult(resultSets) as unknown as ProductSpecification[];
}

export async function validateSpecificationsForCategory(
  ma_danh_muc: number,
  specs: { ma_thong_so: number; gia_tri?: unknown; gia_tri_so?: unknown; gia_tri_bool?: unknown }[]
): Promise<{ valid: boolean; invalidSpecIds: number[]; requiredMissingIds: number[] }> {
  const allowed = await listThongSoByDanhMuc(ma_danh_muc);
  const allowedMap = new Map<number, CategorySpecification>();
  const requiredIds = new Set<number>();

  for (const s of allowed) {
    allowedMap.set(s.ma_thong_so, s);
    if (s.bat_buoc) {
      requiredIds.add(s.ma_thong_so);
    }
  }

  const invalidSpecIds: number[] = [];
  const providedIds = new Set<number>();

  for (const item of specs) {
    const specId = Number(item.ma_thong_so);
    if (!allowedMap.has(specId)) {
      invalidSpecIds.push(specId);
    } else {
      providedIds.add(specId);
    }
  }

  const requiredMissingIds: number[] = [];
  for (const reqId of requiredIds) {
    if (!providedIds.has(reqId)) {
      requiredMissingIds.push(reqId);
    }
  }

  return {
    valid: invalidSpecIds.length === 0,
    invalidSpecIds,
    requiredMissingIds,
  };
}

export async function addThongSoToDanhMuc(
  ma_danh_muc: number,
  ma_thong_so: number,
  bat_buoc = false,
  thu_tu_hien_thi = 0
): Promise<void> {
  await pool.query(
    `INSERT INTO danh_muc_thong_so (ma_danh_muc, ma_thong_so, bat_buoc, thu_tu_hien_thi)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bat_buoc = VALUES(bat_buoc), thu_tu_hien_thi = VALUES(thu_tu_hien_thi)`,
    [ma_danh_muc, ma_thong_so, bat_buoc ? 1 : 0, thu_tu_hien_thi]
  );
}

export async function updateThongSoInDanhMuc(
  ma_danh_muc: number,
  ma_thong_so: number,
  data: { bat_buoc?: boolean; thu_tu_hien_thi?: number }
): Promise<void> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.bat_buoc !== undefined) {
    updates.push('bat_buoc = ?');
    params.push(data.bat_buoc ? 1 : 0);
  }
  if (data.thu_tu_hien_thi !== undefined) {
    updates.push('thu_tu_hien_thi = ?');
    params.push(data.thu_tu_hien_thi);
  }

  if (updates.length === 0) return;

  params.push(ma_danh_muc, ma_thong_so);
  await pool.query(
    `UPDATE danh_muc_thong_so SET ${updates.join(', ')} WHERE ma_danh_muc = ? AND ma_thong_so = ?`,
    params
  );
}

export async function removeThongSoFromDanhMuc(
  ma_danh_muc: number,
  ma_thong_so: number
): Promise<void> {
  await pool.query(
    'DELETE FROM danh_muc_thong_so WHERE ma_danh_muc = ? AND ma_thong_so = ?',
    [ma_danh_muc, ma_thong_so]
  );
}

export async function createThongSo(data: {
  ma_nhom_thong_so: number;
  ten_thong_so: string;
  kieu_du_lieu?: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION';
  don_vi?: string | null;
  cho_phep_loc?: boolean;
  thu_tu_hien_thi?: number;
}): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO thong_so (ma_nhom_thong_so, ten_thong_so, kieu_du_lieu, don_vi, cho_phep_loc, thu_tu_hien_thi, trang_thai)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [
      data.ma_nhom_thong_so,
      data.ten_thong_so.trim(),
      data.kieu_du_lieu || 'TEXT',
      data.don_vi?.trim() || null,
      data.cho_phep_loc ? 1 : 0,
      data.thu_tu_hien_thi || 0,
    ]
  );
  return (result as any).insertId;
}

export async function updateThongSo(
  ma_thong_so: number,
  data: {
    ma_nhom_thong_so?: number;
    ten_thong_so?: string;
    kieu_du_lieu?: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION';
    don_vi?: string | null;
    cho_phep_loc?: boolean;
    thu_tu_hien_thi?: number;
    trang_thai?: boolean;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.ma_nhom_thong_so !== undefined) {
    updates.push('ma_nhom_thong_so = ?');
    params.push(data.ma_nhom_thong_so);
  }
  if (data.ten_thong_so !== undefined) {
    updates.push('ten_thong_so = ?');
    params.push(data.ten_thong_so.trim());
  }
  if (data.kieu_du_lieu !== undefined) {
    updates.push('kieu_du_lieu = ?');
    params.push(data.kieu_du_lieu);
  }
  if (data.don_vi !== undefined) {
    updates.push('don_vi = ?');
    params.push(data.don_vi?.trim() || null);
  }
  if (data.cho_phep_loc !== undefined) {
    updates.push('cho_phep_loc = ?');
    params.push(data.cho_phep_loc ? 1 : 0);
  }
  if (data.thu_tu_hien_thi !== undefined) {
    updates.push('thu_tu_hien_thi = ?');
    params.push(data.thu_tu_hien_thi);
  }
  if (data.trang_thai !== undefined) {
    updates.push('trang_thai = ?');
    params.push(data.trang_thai ? 1 : 0);
  }

  if (updates.length === 0) return;

  params.push(ma_thong_so);
  await pool.query(
    `UPDATE thong_so SET ${updates.join(', ')} WHERE ma_thong_so = ?`,
    params
  );
}

export async function deleteThongSo(ma_thong_so: number): Promise<{ softDeleted: boolean }> {
  // Check if any product is using this specification
  const [inProducts] = await pool.query(
    'SELECT COUNT(*) as count FROM thong_so_san_pham WHERE ma_thong_so = ?',
    [ma_thong_so]
  );
  const count = Number((inProducts as any[])[0]?.count || 0);

  if (count > 0) {
    // Soft delete to preserve historical integrity
    await pool.query('UPDATE thong_so SET trang_thai = FALSE WHERE ma_thong_so = ?', [ma_thong_so]);
    return { softDeleted: true };
  }

  // Not used in any product, safe to remove completely
  await pool.query('DELETE FROM danh_muc_thong_so WHERE ma_thong_so = ?', [ma_thong_so]);
  await pool.query('DELETE FROM thong_so WHERE ma_thong_so = ?', [ma_thong_so]);
  return { softDeleted: false };
}

export async function createNhomThongSo(data: {
  ten_nhom_thong_so: string;
  thu_tu_hien_thi?: number;
}): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO nhom_thong_so (ten_nhom_thong_so, thu_tu_hien_thi, trang_thai)
     VALUES (?, ?, TRUE)`,
    [data.ten_nhom_thong_so.trim(), data.thu_tu_hien_thi || 0]
  );
  return (result as any).insertId;
}

export async function updateNhomThongSo(
  ma_nhom_thong_so: number,
  data: {
    ten_nhom_thong_so?: string;
    thu_tu_hien_thi?: number;
    trang_thai?: boolean;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.ten_nhom_thong_so !== undefined) {
    updates.push('ten_nhom_thong_so = ?');
    params.push(data.ten_nhom_thong_so.trim());
  }
  if (data.thu_tu_hien_thi !== undefined) {
    updates.push('thu_tu_hien_thi = ?');
    params.push(data.thu_tu_hien_thi);
  }
  if (data.trang_thai !== undefined) {
    updates.push('trang_thai = ?');
    params.push(data.trang_thai ? 1 : 0);
  }

  if (updates.length === 0) return;

  params.push(ma_nhom_thong_so);
  await pool.query(
    `UPDATE nhom_thong_so SET ${updates.join(', ')} WHERE ma_nhom_thong_so = ?`,
    params
  );
}
