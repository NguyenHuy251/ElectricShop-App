import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { getGioHangData, gioHangService } from '../services/gioHang.service.js';

export async function getGioHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { cart: cartRows, items } = await getGioHangData(req.user.ma_tai_khoan);
    const cart = cartRows[0];

    if (!cart) {
      return sendSuccess(res, 'Giỏ hàng trống', { ma_gio_hang: null, items: [] });
    }

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

    const result = await gioHangService.addItem([req.user.ma_tai_khoan, ma_san_pham, so_luong]);
    const cart = result[0];
    if (!cart) return sendError(res, 404, 'Sản phẩm không tồn tại');

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

    await gioHangService.updateItem([req.user.ma_tai_khoan, ma_san_pham, so_luong]);

    return sendSuccess(res, 'Cập nhật số lượng thành công', { ma_san_pham: Number(ma_san_pham), so_luong });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật giỏ hàng', [(error as Error).message]);
  }
}

export async function deleteCartItem(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham } = req.params;
    await gioHangService.removeItem([req.user.ma_tai_khoan, ma_san_pham]);
    return sendSuccess(res, 'Xóa sản phẩm khỏi giỏ hàng thành công', { ma_san_pham: Number(ma_san_pham) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa sản phẩm khỏi giỏ hàng', [(error as Error).message]);
  }
}

export async function clearCart(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    await gioHangService.clear(req.user.ma_tai_khoan);
    return sendSuccess(res, 'Xóa giỏ hàng thành công', {});
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa giỏ hàng', [(error as Error).message]);
  }
}
