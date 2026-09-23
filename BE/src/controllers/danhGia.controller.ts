import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllDanhGia(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1), limit = Number(req.query.limit || 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return sendError(res, 400, 'Phân trang không hợp lệ');
    const clauses: string[] = [], values: number[] = [];
    if (req.query.ma_san_pham) {
      const productId = Number(req.query.ma_san_pham);
      if (!Number.isInteger(productId) || productId < 1) return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
      clauses.push('dg.ma_san_pham = ?'); values.push(productId);
    }
    if (req.query.so_sao) {
      const stars = Number(req.query.so_sao);
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) return sendError(res, 400, 'Số sao không hợp lệ');
      clauses.push('dg.so_sao = ?'); values.push(stars);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [counts] = await pool.query(`SELECT COUNT(*) AS total FROM danh_gia dg ${where}`, values);
    const total = Number((counts as { total: number }[])[0].total);
    const [rows] = await pool.query(`SELECT dg.*, tk.ho_ten, sp.ten_san_pham FROM danh_gia dg JOIN tai_khoan tk ON tk.ma_tai_khoan = dg.ma_tai_khoan JOIN san_pham sp ON sp.ma_san_pham = dg.ma_san_pham ${where} ORDER BY dg.ma_danh_gia DESC LIMIT ? OFFSET ?`, [...values, limit, (page - 1) * limit]);
    return sendSuccess(res, 'Danh sách đánh giá', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return sendError(res, 500, 'Không thể tải đánh giá'); }
}

export async function getDanhGiaBySanPham(req: Request, res: Response) {
  try {
    const { ma_san_pham } = req.params;
    const [rows] = await pool.query(
      `SELECT dg.*, tk.ho_ten
       FROM danh_gia dg
       JOIN tai_khoan tk ON tk.ma_tai_khoan = dg.ma_tai_khoan
       WHERE dg.ma_san_pham = ?
       ORDER BY dg.ma_danh_gia DESC`,
      [ma_san_pham],
    );

    return sendSuccess(res, 'Danh sách đánh giá', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy đánh giá', [(error as Error).message]);
  }
}

export async function createDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham, so_sao, noi_dung } = req.body;
    if (!ma_san_pham || !so_sao) return sendError(res, 400, 'Thiếu thông tin đánh giá');
    if (Number(so_sao) < 1 || Number(so_sao) > 5) return sendError(res, 400, 'Số sao phải từ 1 đến 5');

    const [productRows] = await pool.query('SELECT ma_san_pham FROM san_pham WHERE ma_san_pham = ?', [ma_san_pham]);
    if (!(productRows as any[]).length) return sendError(res, 404, 'Sản phẩm không tồn tại');

    const [result] = await pool.execute(
      'INSERT INTO danh_gia (ma_san_pham, ma_tai_khoan, so_sao, noi_dung, ngay_danh_gia) VALUES (?, ?, ?, ?, NOW())',
      [ma_san_pham, req.user.ma_tai_khoan, so_sao, noi_dung || null],
    );

    return sendSuccess(res, 'Gửi đánh giá thành công', { ma_danh_gia: (result as any).insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi đánh giá sản phẩm', [(error as Error).message]);
  }
}

export async function updateDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const { so_sao, noi_dung } = req.body;

    const [rows] = await pool.query('SELECT * FROM danh_gia WHERE ma_danh_gia = ? AND ma_tai_khoan = ?', [id, req.user.ma_tai_khoan]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy đánh giá của bạn');

    await pool.execute(
      'UPDATE danh_gia SET so_sao = COALESCE(?, so_sao), noi_dung = COALESCE(?, noi_dung) WHERE ma_danh_gia = ?',
      [so_sao ?? null, noi_dung ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật đánh giá thành công', { ma_danh_gia: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật đánh giá', [(error as Error).message]);
  }
}

export async function deleteDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const isStaff = ['Admin', 'NhanVien'].includes(req.user.vai_tro);
    const [rows] = await pool.query('SELECT * FROM danh_gia WHERE ma_danh_gia = ?' + (isStaff ? '' : ' AND ma_tai_khoan = ?'), isStaff ? [id] : [id, req.user.ma_tai_khoan]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy đánh giá của bạn');

    await pool.execute('DELETE FROM danh_gia WHERE ma_danh_gia = ?', [id]);
    return sendSuccess(res, 'Xóa đánh giá thành công', { ma_danh_gia: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa đánh giá', [(error as Error).message]);
  }
}
