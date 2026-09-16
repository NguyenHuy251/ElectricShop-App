import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllNhanVien(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM nhan_vien ORDER BY ma_nhan_vien DESC');
    return sendSuccess(res, 'Danh sách nhân viên', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách nhân viên', [(error as Error).message]);
  }
}

export async function getNhanVienById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy nhân viên');
    return sendSuccess(res, 'Nhân viên được tìm thấy', result[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy nhân viên', [(error as Error).message]);
  }
}

export async function createNhanVien(req: Request, res: Response) {
  try {
    const { ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai } = req.body;
    if (!ho_ten) return sendError(res, 400, 'Tên nhân viên là bắt buộc');

    const [result] = await pool.execute(
      `INSERT INTO nhan_vien (ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ma_tai_khoan || null, ho_ten, chuc_vu || null, so_dien_thoai || null, email || null, ngay_vao_lam || null, luong || 0, trang_thai || 'DangLam'],
    );

    const insertResult = result as { insertId: number };
    return sendSuccess(res, 'Thêm nhân viên thành công', { ma_nhan_vien: insertResult.insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi thêm nhân viên', [(error as Error).message]);
  }
}

export async function updateNhanVien(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai } = req.body;

    const [rows] = await pool.query('SELECT * FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy nhân viên');

    await pool.query(
      `UPDATE nhan_vien SET ho_ten = COALESCE(?, ho_ten), chuc_vu = COALESCE(?, chuc_vu), so_dien_thoai = COALESCE(?, so_dien_thoai), email = COALESCE(?, email), ngay_vao_lam = COALESCE(?, ngay_vao_lam), luong = COALESCE(?, luong), trang_thai = COALESCE(?, trang_thai) WHERE ma_nhan_vien = ?`,
      [ho_ten ?? null, chuc_vu ?? null, so_dien_thoai ?? null, email ?? null, ngay_vao_lam ?? null, luong ?? null, trang_thai ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật nhân viên thành công', { ma_nhan_vien: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật nhân viên', [(error as Error).message]);
  }
}

export async function deleteNhanVien(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy nhân viên');

    await pool.query('DELETE FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
    return sendSuccess(res, 'Xóa nhân viên thành công', { ma_nhan_vien: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa nhân viên', [(error as Error).message]);
  }
}
