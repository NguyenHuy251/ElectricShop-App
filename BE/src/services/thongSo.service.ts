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
