import { CheckoutError } from '../utils/checkout.js';
import type { PoolConnection } from 'mysql2/promise';
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

export async function replaceProductVariants(productId: number, variants: { ma_sku: string; ten_bien_the: string; gia_ban: number; so_luong: number; trang_thai: string; thong_so_ky_thuat: unknown[] }[], transaction?: PoolConnection) {
  const connection = transaction || await pool.getConnection();
  try {
    if (!transaction) await connection.beginTransaction();
    // Retain IDs referenced by carts and historical orders, including retired variants.
    await connection.execute("UPDATE san_pham_bien_the SET trang_thai = 'NgungBan' WHERE ma_san_pham = ?", [productId]);
    for (const variant of variants) {
      const [conflicts] = await connection.query('SELECT ma_san_pham, ma_sku FROM san_pham_bien_the WHERE ma_sku = ? OR (ma_san_pham = ? AND ten_bien_the = ?) FOR UPDATE',[variant.ma_sku,productId,variant.ten_bien_the]);
      if ((conflicts as {ma_san_pham:number;ma_sku:string}[]).some(row=>row.ma_san_pham!==productId || row.ma_sku!==variant.ma_sku)) throw new CheckoutError(409, 'SKU hoặc tên biến thể đã được sử dụng.');
      await connection.execute(
        'INSERT INTO san_pham_bien_the (ma_san_pham, ma_sku, ten_bien_the, gia_ban, so_luong, trang_thai, thong_so_json) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ten_bien_the = VALUES(ten_bien_the), gia_ban = VALUES(gia_ban), so_luong = VALUES(so_luong), trang_thai = VALUES(trang_thai), thong_so_json = VALUES(thong_so_json)',
        [productId, variant.ma_sku, variant.ten_bien_the, variant.gia_ban, variant.so_luong, variant.trang_thai, JSON.stringify(variant.thong_so_ky_thuat || [])],
      );
    }
    if (!transaction) await connection.commit();
  } catch (error) {
    if (!transaction) await connection.rollback();
    throw error;
  } finally {
    if (!transaction) connection.release();
  }
}

export async function listSanPham(params: unknown[], sort = 'newest', specifications: Record<string,string> = {}) {
  if (sort !== 'newest' || Object.keys(specifications).length) {
    const [search,category,brand,min,max,limit,offset] = params;
    const clauses = ['(? = \'\' OR sp.ten_san_pham LIKE ? OR sp.ma_san_pham_code LIKE ? OR dm.ten_danh_muc LIKE ?)'];
    const pattern=`%${search}%`;
    const bindings: unknown[]=[search,pattern,pattern,pattern];
    for (const [value,clause] of [[category,'sp.ma_danh_muc = ?'],[brand,'sp.ma_thuong_hieu = ?'],[min,'sp.gia_ban >= ?'],[max,'sp.gia_ban <= ?']]) {
      if (value!=null) {clauses.push(String(clause));bindings.push(value);}
    }
    for (const [key,value] of Object.entries(specifications)) {
      clauses.push(`EXISTS (SELECT 1 FROM thong_so_san_pham tsp WHERE tsp.ma_san_pham=sp.ma_san_pham AND tsp.ma_thong_so=? AND (tsp.gia_tri=? OR CAST(tsp.gia_tri_so AS CHAR)=? OR CAST(tsp.gia_tri_bool AS CHAR)=?))`);
      bindings.push(Number(key),value,value,value);
    }
    const from=' FROM san_pham sp LEFT JOIN danh_muc dm ON dm.ma_danh_muc=sp.ma_danh_muc LEFT JOIN thuong_hieu th ON th.ma_thuong_hieu=sp.ma_thuong_hieu';
    const where=` WHERE ${clauses.join(' AND ')}`;
    const [count] = await pool.query('SELECT COUNT(*) AS total'+from+where,bindings);
    const ordering: Record<string,string>={newest:'sp.ma_san_pham DESC',price_asc:'sp.gia_ban ASC,sp.ma_san_pham DESC',price_desc:'sp.gia_ban DESC,sp.ma_san_pham DESC',bestseller:"(SELECT COALESCE(SUM(ct.so_luong),0) FROM chi_tiet_don_hang ct JOIN don_hang dh USING(ma_don_hang) WHERE ct.ma_san_pham=sp.ma_san_pham AND dh.trang_thai='DaGiao') DESC,sp.ma_san_pham DESC"};
    const [rows]=await pool.query('SELECT sp.*,dm.ten_danh_muc,th.ten_thuong_hieu'+from+where+` ORDER BY ${ordering[sort]} LIMIT ? OFFSET ?`,[...bindings,limit,offset]);
    return {count:count as {total:number}[],rows:(rows as any[]).map(normalizeProductRow)};
  }
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
  images: (string | { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number })[],
  transaction?: PoolConnection
) {
  if (!Array.isArray(images)) return;

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

  if (normalized.length === 0) {
    await (transaction || pool).execute('DELETE FROM hinh_anh_san_pham WHERE ma_san_pham=?',[ma_san_pham]);
    await (transaction || pool).execute('UPDATE san_pham SET hinh_anh=NULL WHERE ma_san_pham=?',[ma_san_pham]);
    return;
  }

  // Ensure exactly one main image
  const primaryIndex=Math.max(0,normalized.findIndex(img=>img.la_anh_chinh));
  normalized.forEach((img,index)=>{img.la_anh_chinh=index===primaryIndex;});

  // Clear existing images and insert new set
  await (transaction || pool).query('DELETE FROM hinh_anh_san_pham WHERE ma_san_pham = ?', [ma_san_pham]);

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
  await (transaction || pool).query(insertSql, [values]);

  // Update main image in san_pham table as well for backward compatibility
  const primaryImg = normalized.find(img => img.la_anh_chinh) || normalized[0];
  if (primaryImg) {
    await (transaction || pool).query('UPDATE san_pham SET hinh_anh = ? WHERE ma_san_pham = ?', [primaryImg.duong_dan, ma_san_pham]);
  }
}

type Images = Parameters<typeof syncProductImages>[1];
type Variants = Parameters<typeof replaceProductVariants>[1];

async function saveProduct(params: unknown[], update: boolean, images?: Images, variants?: Variants) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const values: any[] = update ? params.slice(1) : params;
    const columns = ['ma_danh_muc','ma_thuong_hieu','ma_san_pham_code','ten_san_pham','mo_ta','gia_nhap','gia_ban','so_luong','bao_hanh','hinh_anh','trang_thai'];
    let id = update ? Number(params[0]) : 0;
    if (update) {
      const [existing] = await db.query('SELECT ma_danh_muc FROM san_pham WHERE ma_san_pham=? FOR UPDATE',[id]);
      if (!(existing as any[]).length) throw new Error('Product no longer exists');
      if (values[0] != null && values[0] !== (existing as any[])[0].ma_danh_muc) {
        await db.execute('DELETE FROM thong_so_san_pham WHERE ma_san_pham=?',[id]);
      }
      await db.execute('UPDATE san_pham SET '+columns.map(column=>column+'=COALESCE(?, '+column+')').join(', ')+' WHERE ma_san_pham=?',[...values.slice(0,11),id]);
    } else {
      const [result] = await db.execute('INSERT INTO san_pham ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')',values.slice(0,11));
      id=(result as any).insertId;
    }
    if (values[11] != null) {
      await db.execute('DELETE FROM thong_so_san_pham WHERE ma_san_pham=?',[id]);
      for (const spec of JSON.parse(String(values[11]))) {
        await db.execute('INSERT INTO thong_so_san_pham (ma_san_pham,ma_thong_so,gia_tri,gia_tri_so,gia_tri_bool) VALUES (?,?,?,?,?)',[id,spec.ma_thong_so,spec.gia_tri ?? null,spec.gia_tri_so ?? null,spec.gia_tri_bool ?? null]);
      }
    }
    if (images !== undefined) await syncProductImages(id,images,db);
    if (variants !== undefined) await replaceProductVariants(id,variants,db);
    await db.commit();
    return id;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {db.release();}
}

export async function createSanPham(params: unknown[], images?: Images, variants?: Variants) {
  return saveProduct(params,false,images,variants);
}
export async function updateSanPham(params: unknown[], images?: Images, variants?: Variants) {
  return saveProduct(params,true,images,variants);
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
