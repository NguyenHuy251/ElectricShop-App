import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getGioHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const [cartRows] = await pool.query('SELECT * FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const cart = (cartRows as any[])[0];

    if (!cart) {
      return sendSuccess(res, 'Giỏ hàng trống', { ma_gio_hang: null, items: [] });
    }

    const [items] = await pool.query(
      `SELECT cth.*, sp.ten_san_pham, sp.gia_ban, sp.hinh_anh
       FROM chi_tiet_gio_hang cth
       JOIN san_pham sp ON sp.ma_san_pham = cth.ma_san_pham
       WHERE cth.ma_gio_hang = ?`,
      [cart.ma_gio_hang],
    );

    return sendSuccess(res, 'Lấy giỏ hàng thành công', { ...cart, items });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy giỏ hàng', [(error as Error).message]);
  }
}

export async function addToCart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham, so_luong = 1 } = req.body;
    if (!ma_san_pham) return sendError(res, 400, 'Thiếu mã sản phẩm');

    const [productRows] = await pool.query('SELECT ma_san_pham, so_luong FROM san_pham WHERE ma_san_pham = ?', [ma_san_pham]);
    const product = (productRows as any[])[0];
    if (!product) return sendError(res, 404, 'Sản phẩm không tồn tại');

    let [cartRows] = await pool.query('SELECT * FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    let cart = (cartRows as any[])[0];

    if (!cart) {
      const [insertCart] = await pool.execute('INSERT INTO gio_hang (ma_tai_khoan, ngay_tao) VALUES (?, NOW())', [req.user.ma_tai_khoan]);
      cart = { ma_gio_hang: (insertCart as any).insertId };
    }

    const [existingRows] = await pool.query(
      'SELECT * FROM chi_tiet_gio_hang WHERE ma_gio_hang = ? AND ma_san_pham = ?',
      [cart.ma_gio_hang, ma_san_pham],
    );

    if ((existingRows as any[]).length) {
      await pool.execute(
        'UPDATE chi_tiet_gio_hang SET so_luong = so_luong + ? WHERE ma_gio_hang = ? AND ma_san_pham = ?',
        [so_luong, cart.ma_gio_hang, ma_san_pham],
      );
    } else {
      await pool.execute(
        'INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, so_luong) VALUES (?, ?, ?)',
        [cart.ma_gio_hang, ma_san_pham, so_luong],
      );
    }

    return sendSuccess(res, 'Thêm vào giỏ hàng thành công', { ma_gio_hang: cart.ma_gio_hang });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi thêm vào giỏ hàng', [(error as Error).message]);
  }
}

export async function updateCartItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham } = req.params;
    const { so_luong } = req.body;

    const [cartRows] = await pool.query('SELECT * FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const cart = (cartRows as any[])[0];
    if (!cart) return sendError(res, 404, 'Giỏ hàng không tồn tại');

    await pool.execute(
      'UPDATE chi_tiet_gio_hang SET so_luong = ? WHERE ma_gio_hang = ? AND ma_san_pham = ?',
      [so_luong, cart.ma_gio_hang, ma_san_pham],
    );

    return sendSuccess(res, 'Cập nhật số lượng thành công', { ma_san_pham: Number(ma_san_pham), so_luong });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật giỏ hàng', [(error as Error).message]);
  }
}

export async function deleteCartItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham } = req.params;
    const [cartRows] = await pool.query('SELECT * FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const cart = (cartRows as any[])[0];
    if (!cart) return sendError(res, 404, 'Giỏ hàng không tồn tại');

    await pool.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ? AND ma_san_pham = ?', [cart.ma_gio_hang, ma_san_pham]);
    return sendSuccess(res, 'Xóa sản phẩm khỏi giỏ hàng thành công', { ma_san_pham: Number(ma_san_pham) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa sản phẩm khỏi giỏ hàng', [(error as Error).message]);
  }
}

export async function clearCart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const [cartRows] = await pool.query('SELECT * FROM gio_hang WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const cart = (cartRows as any[])[0];
    if (!cart) return sendSuccess(res, 'Giỏ hàng đã rỗng', {});

    await pool.execute('DELETE FROM chi_tiet_gio_hang WHERE ma_gio_hang = ?', [cart.ma_gio_hang]);
    return sendSuccess(res, 'Xóa giỏ hàng thành công', {});
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa giỏ hàng', [(error as Error).message]);
  }
}
