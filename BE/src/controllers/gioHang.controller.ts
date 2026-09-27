import { Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { CheckoutError } from '../utils/checkout.js';

export async function getGioHang(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  try {
    const [carts] = await pool.query('SELECT ma_gio_hang FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const cart = (carts as { ma_gio_hang: number }[])[0];
    if (!cart) return sendSuccess(res, 'Giỏ hàng trống', { ma_gio_hang: null, items: [] });
    const [items] = await pool.query(`SELECT cth.*, sp.ten_san_pham, sp.gia_ban, sp.hinh_anh, sp.so_luong AS ton_kho, sp.trang_thai
      FROM chi_tiet_gio_hang cth JOIN san_pham sp ON sp.ma_san_pham = cth.ma_san_pham WHERE cth.ma_gio_hang = ? ORDER BY cth.ma_san_pham`, [cart.ma_gio_hang]);
    return sendSuccess(res, 'Lấy giỏ hàng thành công', { ...cart, items });
  } catch { return sendError(res, 503, 'Không thể tải giỏ hàng. Vui lòng thử lại.'); }
}

async function mutateCart(req: AuthRequest, res: Response, action: 'add' | 'update' | 'delete' | 'clear') {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  const productId = Number(action === 'add' ? req.body.ma_san_pham : req.params.ma_san_pham);
  const quantity = req.body?.so_luong ?? (action === 'add' ? 1 : undefined);
  if (action !== 'clear' && (!Number.isSafeInteger(productId) || productId < 1)) return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
  if (['add', 'update'].includes(action) && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999)) return sendError(res, 400, 'Số lượng phải là số nguyên từ 1 đến 999');
  try {
    const connection = await pool.getConnection();
    try {
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
      await connection.beginTransaction();
      if (action === 'add') await connection.execute('INSERT INTO gio_hang (ma_tai_khoan) VALUES (?) ON DUPLICATE KEY UPDATE ma_tai_khoan = VALUES(ma_tai_khoan)', [req.user.ma_tai_khoan]);
      const [carts] = await connection.query('SELECT ma_gio_hang FROM gio_hang WHERE ma_tai_khoan = ? FOR UPDATE', [req.user.ma_tai_khoan]);
      const cart = (carts as { ma_gio_hang: number }[])[0];
      if (!cart) throw new CheckoutError(404, 'Giỏ hàng không tồn tại');
      if (action === 'clear') await connection.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [cart.ma_gio_hang]);
      else if (action === 'delete') await connection.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ? AND ma_san_pham = ?', [cart.ma_gio_hang, productId]);
      else {
        const [lines] = await connection.query('SELECT so_luong FROM chi_tiet_gio_hang WHERE ma_gio_hang = ? AND ma_san_pham = ? FOR UPDATE', [cart.ma_gio_hang, productId]);
        const existing = (lines as { so_luong: number }[])[0];
        if (action === 'update' && !existing) throw new CheckoutError(404, 'Sản phẩm không còn trong giỏ hàng');
        const next = action === 'add' ? (existing?.so_luong || 0) + quantity : quantity;
        const [products] = await connection.query('SELECT so_luong, trang_thai FROM san_pham WHERE ma_san_pham = ? FOR UPDATE', [productId]);
        const product = (products as { so_luong: number; trang_thai: string }[])[0];
        if (!product) throw new CheckoutError(404, 'Sản phẩm không tồn tại');
        if (product.trang_thai !== 'DangBan') throw new CheckoutError(409, 'Sản phẩm hiện không bán');
        if (next > product.so_luong || next > 999) throw new CheckoutError(409, `Chỉ có thể chọn tối đa ${Math.min(product.so_luong, 999)} sản phẩm`);
        await connection.execute('INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, so_luong) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE so_luong = VALUES(so_luong)', [cart.ma_gio_hang, productId, next]);
      }
      await connection.commit();
      return sendSuccess(res, 'Đã cập nhật giỏ hàng', { ma_gio_hang: cart.ma_gio_hang });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) {
    return sendError(res, error instanceof CheckoutError ? error.status : 503, error instanceof CheckoutError ? error.message : 'Chưa thể cập nhật giỏ hàng. Vui lòng thử lại.');
  }
}

export const addToCart = (req: AuthRequest, res: Response) => mutateCart(req, res, 'add');
export const updateCartItem = (req: AuthRequest, res: Response) => mutateCart(req, res, 'update');
export const deleteCartItem = (req: AuthRequest, res: Response) => mutateCart(req, res, 'delete');
export const clearCart = (req: AuthRequest, res: Response) => mutateCart(req, res, 'clear');
