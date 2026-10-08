import type { Pool, PoolConnection } from 'mysql2/promise';
import { CheckoutError, type CheckoutItem } from '../utils/checkout.js';

export const cartItemsSql = `SELECT cth.ma_san_pham, cth.ma_bien_the, cth.so_luong, sp.ten_san_pham, sp.hinh_anh,
  (cth.ma_bien_the IS NULL AND EXISTS (SELECT 1 FROM san_pham_bien_the v WHERE v.ma_san_pham=sp.ma_san_pham)) AS needs_variant,
  bt.ten_bien_the, IF(cth.ma_bien_the IS NULL, sp.gia_ban, bt.gia_ban) AS gia_ban,
  IF(cth.ma_bien_the IS NULL, sp.so_luong, COALESCE(bt.so_luong, 0)) AS ton_kho,
  IF(sp.trang_thai <> 'DangBan', sp.trang_thai, IF(cth.ma_bien_the IS NULL, sp.trang_thai, COALESCE(bt.trang_thai, 'NgungBan'))) AS trang_thai
  FROM gio_hang gh JOIN chi_tiet_gio_hang cth ON cth.ma_gio_hang = gh.ma_gio_hang
  JOIN san_pham sp ON sp.ma_san_pham = cth.ma_san_pham
  LEFT JOIN san_pham_bien_the bt ON bt.ma_bien_the = cth.ma_bien_the AND bt.ma_san_pham = sp.ma_san_pham
  WHERE gh.ma_tai_khoan = ? ORDER BY cth.ma_san_pham, cth.ma_bien_the`;

export async function resolveItem(db: Pool | PoolConnection, productId: number, variantId?: number | null, lock = false): Promise<CheckoutItem> {
  const [rows] = await db.query('SELECT ma_san_pham, ten_san_pham, gia_ban, hinh_anh, so_luong AS ton_kho, trang_thai FROM san_pham WHERE ma_san_pham = ?' + (lock ? ' FOR UPDATE' : ''), [productId]);
  const product = (rows as CheckoutItem[])[0];
  if (!product) throw new CheckoutError(404, 'Sản phẩm không còn tồn tại.');
  if (!variantId) {
    const [variants] = await db.query('SELECT ma_bien_the FROM san_pham_bien_the WHERE ma_san_pham = ? LIMIT 1', [productId]);
    if ((variants as unknown[]).length) throw new CheckoutError(409, 'Vui lòng chọn biến thể của sản phẩm trước khi mua.');
    return product;
  }
  const [variants] = await db.query('SELECT ma_bien_the, ten_bien_the, gia_ban, so_luong AS ton_kho, trang_thai FROM san_pham_bien_the WHERE ma_bien_the = ? AND ma_san_pham = ?' + (lock ? ' FOR UPDATE' : ''), [variantId, productId]);
  const variant = (variants as CheckoutItem[])[0];
  if (!variant) throw new CheckoutError(409, 'Biến thể không còn tồn tại hoặc không thuộc sản phẩm.');
  return { ...product, ...variant, trang_thai: product.trang_thai === 'DangBan' ? variant.trang_thai : product.trang_thai };
}
