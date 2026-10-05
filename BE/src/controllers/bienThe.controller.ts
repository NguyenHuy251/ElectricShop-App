import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export function validateVariantGroup(productId: number, body: any) {
  if (!Number.isSafeInteger(productId) || productId < 1) throw new Error('Mã sản phẩm không hợp lệ');
  if (!Array.isArray(body?.variants) || body.variants.length > 20) throw new Error('Nhóm biến thể tối đa 20 sản phẩm');
  if (body.variants.length === 0) return { attribute: '', variants: [] as { id: number; label: string }[] };
  const attribute = typeof body.ten_thuoc_tinh === 'string' ? body.ten_thuoc_tinh.trim() : '';
  if (!attribute || attribute.length > 80) throw new Error('Tên thuộc tính phải từ 1 đến 80 ký tự');
  if (body.variants.length < 2) throw new Error('Chọn ít nhất 2 sản phẩm cho nhóm biến thể');
  const variants = body.variants.map((item: any) => ({ id: item?.ma_san_pham, label: typeof item?.gia_tri === 'string' ? item.gia_tri.trim() : '' }));
  if (variants.some((v: any) => !Number.isSafeInteger(v.id) || v.id < 1 || !v.label || v.label.length > 80)) throw new Error('Sản phẩm hoặc nhãn biến thể không hợp lệ');
  if (!variants.some((v: any) => v.id === productId)) throw new Error('Nhóm phải bao gồm sản phẩm đang chỉnh sửa');
  if (new Set(variants.map((v: any) => v.id)).size !== variants.length || new Set(variants.map((v: any) => v.label.toLocaleLowerCase('vi').normalize('NFC'))).size !== variants.length) throw new Error('Sản phẩm và nhãn biến thể không được trùng');
  return { attribute, variants: variants as { id: number; label: string }[] };
}

export async function getVariants(productId: number) {
  const [rows] = await pool.query(`SELECT v.ma_san_pham, v.ten_thuoc_tinh, v.gia_tri, sp.ten_san_pham, sp.gia_ban, sp.so_luong, sp.hinh_anh, sp.trang_thai
    FROM bien_the_san_pham own JOIN bien_the_san_pham v ON v.nhom_bien_the = own.nhom_bien_the
    JOIN san_pham sp ON sp.ma_san_pham = v.ma_san_pham WHERE own.ma_san_pham = ? ORDER BY v.thu_tu, v.ma_san_pham`, [productId]);
  return rows;
}

export async function listVariants(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
  try { return sendSuccess(res, 'Các biến thể sản phẩm', await getVariants(id)); }
  catch { return sendError(res, 500, 'Không thể tải biến thể sản phẩm'); }
}

export async function saveVariants(req: Request, res: Response) {
  const id = Number(req.params.id);
  let input;
  try { input = validateVariantGroup(id, req.body); }
  catch (error) { return sendError(res, 400, (error as Error).message); }
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // All editors lock product rows in the same order before modifying memberships.
      const ids = [...new Set([id, ...input.variants.map(v => v.id)])].sort((a, b) => a - b);
      const [products] = await connection.query(`SELECT ma_san_pham, ma_danh_muc, ma_thuong_hieu FROM san_pham WHERE ma_san_pham IN (${ids.map(() => '?').join(',')}) ORDER BY ma_san_pham FOR UPDATE`, ids);
      const rows = products as { ma_san_pham: number; ma_danh_muc: number; ma_thuong_hieu: number }[];
      if (rows.length !== ids.length) { await connection.rollback(); return sendError(res, 404, 'Một sản phẩm không còn tồn tại'); }
      if (rows.some(p => p.ma_danh_muc !== rows[0].ma_danh_muc || p.ma_thuong_hieu !== rows[0].ma_thuong_hieu)) { await connection.rollback(); return sendError(res, 400, 'Các biến thể phải cùng danh mục và thương hiệu'); }
      const [own] = await connection.query('SELECT nhom_bien_the FROM bien_the_san_pham WHERE ma_san_pham = ? FOR UPDATE', [id]);
      const currentGroup = (own as { nhom_bien_the: string }[])[0]?.nhom_bien_the;
      const [members] = await connection.query(`SELECT nhom_bien_the FROM bien_the_san_pham WHERE ma_san_pham IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids);
      if ((members as { nhom_bien_the: string }[]).some(m => m.nhom_bien_the !== currentGroup)) { await connection.rollback(); return sendError(res, 409, 'Một sản phẩm thuộc nhóm biến thể khác. Hãy gỡ khỏi nhóm đó trước.'); }
      if (currentGroup) await connection.execute('DELETE FROM bien_the_san_pham WHERE nhom_bien_the = ?', [currentGroup]);
      const group = currentGroup || randomUUID();
      for (const [index, variant] of input.variants.entries()) await connection.execute('INSERT INTO bien_the_san_pham (ma_san_pham, nhom_bien_the, ten_thuoc_tinh, gia_tri, thu_tu) VALUES (?, ?, ?, ?, ?)', [variant.id, group, input.attribute, variant.label, index]);
      await connection.commit();
      return sendSuccess(res, input.variants.length ? 'Đã lưu nhóm biến thể' : 'Đã gỡ nhóm biến thể', { ma_san_pham: id });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { return sendError(res, (error as { code?: string }).code === 'ER_DUP_ENTRY' ? 409 : 500, 'Không thể lưu nhóm biến thể. Vui lòng tải lại và thử lại.'); }
}
