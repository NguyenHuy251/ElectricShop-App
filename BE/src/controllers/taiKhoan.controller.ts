import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllTaiKhoan(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai, ngay_tao FROM tai_khoan ORDER BY ma_tai_khoan DESC');
    return sendSuccess(res, 'Danh sách tài khoản', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách tài khoản', [(error as Error).message]);
  }
}

export async function getTaiKhoanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai, ngay_tao FROM tai_khoan WHERE ma_tai_khoan = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');
    return sendSuccess(res, 'Tài khoản được tìm thấy', result[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy tài khoản', [(error as Error).message]);
  }
}

export async function updateTaiKhoan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai } = req.body;

    const [rows] = await pool.query('SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');

    await pool.query(
      `UPDATE tai_khoan SET ho_ten = COALESCE(?, ho_ten), email = COALESCE(?, email), so_dien_thoai = COALESCE(?, so_dien_thoai), dia_chi = COALESCE(?, dia_chi), vai_tro = COALESCE(?, vai_tro), trang_thai = COALESCE(?, trang_thai) WHERE ma_tai_khoan = ?`,
      [ho_ten ?? null, email ?? null, so_dien_thoai ?? null, dia_chi ?? null, vai_tro ?? null, trang_thai ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật tài khoản thành công', { ma_tai_khoan: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật tài khoản', [(error as Error).message]);
  }
}

export async function deleteTaiKhoan(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');

    await pool.query('DELETE FROM tai_khoan WHERE ma_tai_khoan = ?', [id]);
    return sendSuccess(res, 'Xóa tài khoản thành công', { ma_tai_khoan: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa tài khoản', [(error as Error).message]);
  }
}
