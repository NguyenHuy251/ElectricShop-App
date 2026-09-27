import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

export { createDonHang } from './checkout.controller.js';

export async function getDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    let query = 'SELECT dh.*, tk.ten_dang_nhap, tk.ho_ten FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan = dh.ma_tai_khoan';
    const params: any[] = [];

    if (req.user.vai_tro === 'KhachHang') {
      query += ' WHERE dh.ma_tai_khoan = ?';
      params.push(req.user.ma_tai_khoan);
    }

    query += ' ORDER BY dh.ma_don_hang DESC';

    const [orders] = await pool.query(query, params);
    const result = orders as any[];

    for (const order of result) {
      const [items] = await pool.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang = ?', [order.ma_don_hang]);
      order.items = items;
    }

    return sendSuccess(res, 'Danh sách đơn hàng', result);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy đơn hàng', [(error as Error).message]);
  }
}

export async function getDonHangById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const [rows] = await pool.query('SELECT dh.*, tk.ten_dang_nhap, tk.ho_ten FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan = dh.ma_tai_khoan WHERE dh.ma_don_hang = ?', [id]);
    const order = (rows as any[])[0];
    if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

    if (req.user.vai_tro === 'KhachHang' && order.ma_tai_khoan !== req.user.ma_tai_khoan) {
      return sendError(res, 403, 'Bạn không có quyền xem đơn hàng này');
    }

    const [items] = await pool.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang = ?', [id]);
    order.items = items;

    return sendSuccess(res, 'Chi tiết đơn hàng', order);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy chi tiết đơn hàng', [(error as Error).message]);
  }
}

export async function updateTrangThaiDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    const transitions: Record<string, string[]> = { ChoXacNhan: ['DaXacNhan', 'DaHuy'], DaXacNhan: ['DangGiao', 'DaHuy'], DangGiao: ['DaGiao', 'DaHuy'], DaGiao: [], DaHuy: [] };
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query('SELECT trang_thai FROM don_hang WHERE ma_don_hang = ? FOR UPDATE', [id]);
      const order = (rows as { trang_thai: string }[])[0];
      if (!order) { await connection.rollback(); return sendError(res, 404, 'Không tìm thấy đơn hàng'); }
      if (!transitions[order.trang_thai]?.includes(trang_thai)) { await connection.rollback(); return sendError(res, 409, 'Không thể chuyển trạng thái đơn hàng theo luồng này. Hãy tải lại danh sách.'); }
      if (trang_thai === 'DaHuy') {
        const [items] = await connection.query('SELECT ma_san_pham, so_luong FROM chi_tiet_don_hang WHERE ma_don_hang = ? ORDER BY ma_san_pham', [id]);
        for (const item of items as { ma_san_pham: number; so_luong: number }[]) {
          await connection.execute('UPDATE san_pham SET so_luong = so_luong + ? WHERE ma_san_pham = ?', [item.so_luong, item.ma_san_pham]);
        }
      }
      await connection.execute('UPDATE don_hang SET trang_thai = ? WHERE ma_don_hang = ?', [trang_thai, id]);
      await connection.commit();
      return sendSuccess(res, 'Cập nhật trạng thái đơn hàng thành công', { ma_don_hang: Number(id), trang_thai });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) {
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
    return sendError(res, 500, 'Lỗi khi huỷ đơn hàng', [(error as Error).message]);
  }
}

export async function deleteDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM don_hang WHERE ma_don_hang = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy đơn hàng');
    if (!['DaGiao', 'DaHuy'].includes((rows as { trang_thai: string }[])[0].trang_thai)) return sendError(res, 409, 'Chỉ được xóa đơn đã giao hoặc đã hủy');

    await pool.execute('DELETE FROM don_hang WHERE ma_don_hang = ?', [id]);
    return sendSuccess(res, 'Xóa đơn hàng thành công', { ma_don_hang: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa đơn hàng', [(error as Error).message]);
  }
}
