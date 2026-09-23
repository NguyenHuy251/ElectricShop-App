import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function createLienHe(req: AuthRequest, res: Response) {
  try {
    const { ho_ten, email, so_dien_thoai, tieu_de, noi_dung } = req.body;
    if (!ho_ten || !email || !tieu_de || !noi_dung) {
      return sendError(res, 400, 'Thiếu thông tin liên hệ bắt buộc');
    }

    const maTaiKhoan = req.user?.ma_tai_khoan ?? null;
    const [result] = await pool.execute(
      'INSERT INTO lien_he (ma_tai_khoan, ho_ten, email, so_dien_thoai, tieu_de, noi_dung, trang_thai, ngay_gui) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [maTaiKhoan, ho_ten, email, so_dien_thoai || null, tieu_de, noi_dung, 'ChuaXuLy'],
    );

    return sendSuccess(res, 'Gửi liên hệ thành công', { ma_lien_he: (result as any).insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi gửi liên hệ', [(error as Error).message]);
  }
}

export async function getAllLienHe(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM lien_he ORDER BY ma_lien_he DESC');
    return sendSuccess(res, 'Danh sách liên hệ', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách liên hệ', [(error as Error).message]);
  }
}

export async function getLienHeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM lien_he WHERE ma_lien_he = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy liên hệ');
    return sendSuccess(res, 'Chi tiết liên hệ', (rows as any[])[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy liên hệ', [(error as Error).message]);
  }
}

export async function updateLienHe(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    if (!['ChuaXuLy', 'DangXuLy', 'DaXuLy'].includes(trang_thai)) return sendError(res, 400, 'Trạng thái liên hệ không hợp lệ');

    const [rows] = await pool.query('SELECT * FROM lien_he WHERE ma_lien_he = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy liên hệ');

    await pool.execute('UPDATE lien_he SET trang_thai = ? WHERE ma_lien_he = ?', [trang_thai, id]);
    return sendSuccess(res, 'Cập nhật trạng thái liên hệ thành công', { ma_lien_he: Number(id), trang_thai });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật liên hệ', [(error as Error).message]);
  }
}

export async function deleteLienHe(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM lien_he WHERE ma_lien_he = ?', [id]);
    if (!(rows as any[]).length) return sendError(res, 404, 'Không tìm thấy liên hệ');

    await pool.execute('DELETE FROM lien_he WHERE ma_lien_he = ?', [id]);
    return sendSuccess(res, 'Xóa liên hệ thành công', { ma_lien_he: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa liên hệ', [(error as Error).message]);
  }
}
