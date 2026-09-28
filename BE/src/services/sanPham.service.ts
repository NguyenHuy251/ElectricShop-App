import { pool } from '../config/database.js';
import { callProcedure, firstResult, secondResult } from './procedure.service.js';
import type { Product, ProductImage, ProductSpecification } from '../types/index.js';

export const sanPhamProcedures = {
  list: 'sp_san_pham_list',
  getById: 'sp_san_pham_get_by_id',
  create: 'sp_san_pham_create',
  update: 'sp_san_pham_update',
  remove: 'sp_san_pham_delete',
} as const;

export function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value == null) return defaultValue;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function normalizeProductRow(row: any): Product {
  if (!row) return row;
  const thong_so_ky_thuat: ProductSpecification[] = parseJsonField(row.thong_so_ky_thuat, []);
  const danh_sach_hinh_anh: ProductImage[] = parseJsonField(row.danh_sach_hinh_anh, []);

  // Determine main image
  const primaryImg = danh_sach_hinh_anh.find(img => img.la_anh_chinh) || danh_sach_hinh_anh[0];
  const hinh_anh = row.hinh_anh || primaryImg?.duong_dan || null;

  return {
    ...row,
    hinh_anh,
    thong_so_ky_thuat,
    danh_sach_hinh_anh,
    images: danh_sach_hinh_anh,
  };
}

export async function listSanPham(params: unknown[]) {
  const resultSets = await callProcedure(sanPhamProcedures.list, params);
  const count = firstResult<{ total: number }>(resultSets);
  const rows = secondResult<any>(resultSets).map(normalizeProductRow);
  return { count, rows };
}

export async function getSanPhamById(id: number) {
  const resultSets = await callProcedure(sanPhamProcedures.getById, [id]);
  const productRows = firstResult<any>(resultSets);
  const categorySpecs = secondResult<any>(resultSets);

  if (!productRows.length) return null;
  const product = normalizeProductRow(productRows[0]);
  return { product, categorySpecs };
}

export async function findSanPhamByCode(code: string) {
  return firstResult(await callProcedure('sp_san_pham_find_by_code', [code]));
}

export async function syncProductImages(
  ma_san_pham: number,
  images: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[]
) {
  if (!Array.isArray(images) || images.length === 0) return;

  const normalized = images.map((item, index) => {
    if (typeof item === 'string') {
      return {
        duong_dan: item.trim(),
        mo_ta: null,
        la_anh_chinh: index === 0,
        thu_tu_hien_thi: index + 1,
      };
    }
    return {
      duong_dan: String(item.duong_dan || '').trim(),
      mo_ta: item.mo_ta ?? null,
      la_anh_chinh: Boolean(item.la_anh_chinh),
      thu_tu_hien_thi: Number(item.thu_tu_hien_thi) || index + 1,
    };
  }).filter(img => img.duong_dan.length > 0);

  if (normalized.length === 0) return;

  // Ensure exactly one main image
  const hasPrimary = normalized.some(img => img.la_anh_chinh);
  if (!hasPrimary) {
    normalized[0].la_anh_chinh = true;
  }

  // Clear existing images and insert new set
  await pool.query('DELETE FROM hinh_anh_san_pham WHERE ma_san_pham = ?', [ma_san_pham]);

  const insertSql = `
    INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan, mo_ta, la_anh_chinh, thu_tu_hien_thi)
    VALUES ?
  `;
  const values = normalized.map(img => [
    ma_san_pham,
    img.duong_dan,
    img.mo_ta,
    img.la_anh_chinh ? 1 : 0,
    img.thu_tu_hien_thi,
  ]);
  await pool.query(insertSql, [values]);

  // Update main image in san_pham table as well for backward compatibility
  const primaryImg = normalized.find(img => img.la_anh_chinh) || normalized[0];
  if (primaryImg) {
    await pool.query('UPDATE san_pham SET hinh_anh = ? WHERE ma_san_pham = ?', [primaryImg.duong_dan, ma_san_pham]);
  }
}

export async function createSanPham(
  params: unknown[],
  images?: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[]
) {
  const result = await callProcedure(sanPhamProcedures.create, params);
  const insertId = (firstResult<{ insertId: number }>(result)[0] || {}).insertId;

  if (insertId && images && images.length > 0) {
    await syncProductImages(insertId, images);
  }

  return insertId;
}

export async function updateSanPham(
  params: unknown[],
  images?: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[]
) {
  const result = await callProcedure(sanPhamProcedures.update, params);
  const id = Number(params[0]);

  if (id && images && images.length > 0) {
    await syncProductImages(id, images);
  }

  return result;
}

export async function deleteSanPham(id: number) {
  return firstResult(await callProcedure(sanPhamProcedures.remove, [id]));
}

export async function getProductImages(ma_san_pham: number): Promise<ProductImage[]> {
  const [rows] = await pool.query(
    'SELECT ma_hinh_anh, ma_san_pham, duong_dan, mo_ta, la_anh_chinh, thu_tu_hien_thi FROM hinh_anh_san_pham WHERE ma_san_pham = ? ORDER BY la_anh_chinh DESC, thu_tu_hien_thi, ma_hinh_anh',
    [ma_san_pham]
  );
  return rows as ProductImage[];
}

export async function addProductImage(
  ma_san_pham: number,
  img: { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number }
) {
  if (img.la_anh_chinh) {
    await pool.query('UPDATE hinh_anh_san_pham SET la_anh_chinh = FALSE WHERE ma_san_pham = ?', [ma_san_pham]);
    await pool.query('UPDATE san_pham SET hinh_anh = ? WHERE ma_san_pham = ?', [img.duong_dan, ma_san_pham]);
  }
  const [res] = await pool.query(
    'INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan, mo_ta, la_anh_chinh, thu_tu_hien_thi) VALUES (?, ?, ?, ?, ?)',
    [ma_san_pham, img.duong_dan, img.mo_ta || null, img.la_anh_chinh ? 1 : 0, img.thu_tu_hien_thi || 1]
  );
  return (res as any).insertId;
}

export async function deleteProductImage(ma_san_pham: number, ma_hinh_anh: number) {
  const [target] = await pool.query(
    'SELECT la_anh_chinh FROM hinh_anh_san_pham WHERE ma_san_pham = ? AND ma_hinh_anh = ?',
    [ma_san_pham, ma_hinh_anh]
  );
  const wasPrimary = (target as any[])[0]?.la_anh_chinh;

  await pool.query('DELETE FROM hinh_anh_san_pham WHERE ma_san_pham = ? AND ma_hinh_anh = ?', [ma_san_pham, ma_hinh_anh]);

  if (wasPrimary) {
    const [remaining] = await pool.query(
      'SELECT ma_hinh_anh, duong_dan FROM hinh_anh_san_pham WHERE ma_san_pham = ? ORDER BY thu_tu_hien_thi, ma_hinh_anh LIMIT 1',
      [ma_san_pham]
    );
    const firstRemaining = (remaining as any[])[0];
    if (firstRemaining) {
      await pool.query('UPDATE hinh_anh_san_pham SET la_anh_chinh = TRUE WHERE ma_hinh_anh = ?', [firstRemaining.ma_hinh_anh]);
      await pool.query('UPDATE san_pham SET hinh_anh = ? WHERE ma_san_pham = ?', [firstRemaining.duong_dan, ma_san_pham]);
    } else {
      await pool.query('UPDATE san_pham SET hinh_anh = NULL WHERE ma_san_pham = ?', [ma_san_pham]);
    }
  }
}

export async function setPrimaryProductImage(ma_san_pham: number, ma_hinh_anh: number) {
  const [target] = await pool.query(
    'SELECT duong_dan FROM hinh_anh_san_pham WHERE ma_san_pham = ? AND ma_hinh_anh = ?',
    [ma_san_pham, ma_hinh_anh]
  );
  if (!(target as any[]).length) {
    throw new Error('Không tìm thấy hình ảnh');
  }
  const duong_dan = (target as any[])[0].duong_dan;

  await pool.query('UPDATE hinh_anh_san_pham SET la_anh_chinh = FALSE WHERE ma_san_pham = ?', [ma_san_pham]);
  await pool.query('UPDATE hinh_anh_san_pham SET la_anh_chinh = TRUE WHERE ma_san_pham = ? AND ma_hinh_anh = ?', [ma_san_pham, ma_hinh_anh]);
  await pool.query('UPDATE san_pham SET hinh_anh = ? WHERE ma_san_pham = ?', [duong_dan, ma_san_pham]);
}
