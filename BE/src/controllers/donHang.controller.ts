import { pool } from '../config/database.js';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import * as donHangService from '../services/donHang.service.js';

export { createDonHang } from './checkout.controller.js';

export async function getDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const data = await donHangService.listDonHang(req.user.ma_tai_khoan, req.user.vai_tro === 'KhachHang');
    const result = data.orders as any[];
    for (const order of result) order.items = data.items.filter(item => item.ma_don_hang === order.ma_don_hang);

    return sendSuccess(res, 'Danh sách đơn hàng', result);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy đơn hàng', [(error as Error).message]);
  }
}

export async function getDonHangById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const data = await donHangService.getDonHangById(Number(id));
    const order = data.order[0] as any;
    if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

    if (req.user.vai_tro === 'KhachHang' && order.ma_tai_khoan !== req.user.ma_tai_khoan) {
      return sendError(res, 403, 'Bạn không có quyền xem đơn hàng này');
    }

    order.items = data.items;
    const [discounts] = await pool.query('SELECT code AS ma_giam_gia, tam_tinh, tien_giam FROM voucher_su_dung WHERE ma_don_hang = ?', [id]);
    Object.assign(order, (discounts as object[])[0] || { tien_giam: 0 });
    order.can_review = order.ma_tai_khoan === req.user.ma_tai_khoan && order.trang_thai === 'DaGiao';

    const [reviews] = await pool.query('SELECT ma_danh_gia, ma_san_pham, so_sao, noi_dung FROM danh_gia WHERE ma_tai_khoan = ?', [order.ma_tai_khoan]);
    order.reviews = reviews;

    return sendSuccess(res, 'Chi tiết đơn hàng', order);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy chi tiết đơn hàng', [(error as Error).message]);
  }
}

export async function updateTrangThaiDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    const result = await donHangService.donHangService.updateStatus([Number(id), trang_thai]);
    return sendSuccess(res, 'Cập nhật trạng thái đơn hàng thành công', result[0] || { ma_don_hang: Number(id), trang_thai });
  } catch (error) {
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Khong tim thay')) return sendError(res, 404, 'Không tìm thấy đơn hàng');
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('khong hop le')) return sendError(res, 409, 'Không thể chuyển trạng thái đơn hàng theo luồng này. Hãy tải lại danh sách.');
    return sendError(res, 500, 'Lỗi khi cập nhật trạng thái đơn hàng', [(error as Error).message]);
  }
}

export async function cancelDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.query(
        'SELECT ma_don_hang, trang_thai FROM don_hang WHERE ma_don_hang = ? AND ma_tai_khoan = ? FOR UPDATE',
        [id, req.user.ma_tai_khoan],
      );
      const order = (orderRows as any[])[0];

      if (!order) {
        await connection.rollback();
        return sendError(res, 404, 'Không tìm thấy đơn hàng của bạn');
      }

      if (order.trang_thai !== 'ChoXacNhan') {
        await connection.rollback();
        return sendError(res, 400, 'Chỉ có thể huỷ đơn hàng đang chờ xác nhận');
      }

      const [items] = await connection.query(
        'SELECT ma_san_pham, so_luong FROM chi_tiet_don_hang WHERE ma_don_hang = ? ORDER BY ma_san_pham',
        [id],
      );

      for (const item of items as any[]) {
        await connection.execute(
          'UPDATE san_pham SET so_luong = so_luong + ? WHERE ma_san_pham = ?',
          [item.so_luong, item.ma_san_pham],
        );
      }

      await connection.execute(
        'UPDATE don_hang SET trang_thai = ? WHERE ma_don_hang = ?',
        ['DaHuy', id],
      );
      await connection.commit();

      return sendSuccess(res, 'Huỷ đơn hàng thành công', { ma_don_hang: Number(id), trang_thai: 'DaHuy' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Khong tim thay')) return sendError(res, 404, 'Không tìm thấy đơn hàng của bạn');
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Chi huy')) return sendError(res, 400, 'Chỉ có thể huỷ đơn hàng đang chờ xác nhận');
    return sendError(res, 500, 'Lỗi khi huỷ đơn hàng', [(error as Error).message]);
  }
}

export async function deleteDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = await donHangService.getDonHangById(Number(id));
    if (!data.order.length) return sendError(res, 404, 'Không tìm thấy đơn hàng');
    if (!['DaGiao', 'DaHuy'].includes(String((data.order[0] as any).trang_thai))) return sendError(res, 409, 'Chỉ được xóa đơn đã giao hoặc đã hủy');
    await donHangService.donHangService.remove(Number(id));
    return sendSuccess(res, 'Xóa đơn hàng thành công', { ma_don_hang: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa đơn hàng', [(error as Error).message]);
  }
}
