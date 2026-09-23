import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

async function validateAccount(accountId: unknown, employeeId?: string | string[]) {
  if (accountId == null || accountId === '') return '';
  if (!Number.isInteger(Number(accountId)) || Number(accountId) < 1) return 'Tài khoản không hợp lệ';
  const [accounts] = await pool.query("SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan = ? AND vai_tro IN ('Admin', 'NhanVien')", [accountId]);
  if (!(accounts as unknown[]).length) return 'Chọn tài khoản Admin hoặc Nhân viên có thật';
  const [employees] = await pool.query('SELECT ma_nhan_vien FROM nhan_vien WHERE ma_tai_khoan = ? AND ma_nhan_vien <> ?', [accountId, employeeId || 0]);
  return (employees as unknown[]).length ? 'Tài khoản đã liên kết với nhân viên khác' : '';
}

export async function getAllNhanVien(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM nhan_vien ORDER BY ma_nhan_vien DESC');
    return sendSuccess(res, 'Danh sách nhân viên', rows);
  } catch (error) {
    if (duplicateField(error, res, 'ma_tai_khoan', 'Tài khoản đã liên kết với nhân viên khác')) return;
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
    if (duplicateField(error, res, 'ma_tai_khoan', 'Tài khoản đã liên kết với nhân viên khác')) return;
    return sendError(res, 500, 'Lỗi khi lấy nhân viên', [(error as Error).message]);
  }
}

export async function createNhanVien(req: Request, res: Response) {
  try {
    const { ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai } = req.body;
    if (!ho_ten) return sendError(res, 400, 'Tên nhân viên là bắt buộc');
    const accountError = await validateAccount(ma_tai_khoan);
    if (accountError) return res.status(400).json({ success: false, message: accountError, fieldErrors: { ma_tai_khoan: accountError } });

    const [result] = await pool.execute(
      `INSERT INTO nhan_vien (ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ma_tai_khoan || null, ho_ten, chuc_vu || null, so_dien_thoai || null, email || null, ngay_vao_lam || null, luong || 0, trang_thai || 'DangLam'],
    );

    const insertResult = result as { insertId: number };
    return sendSuccess(res, 'Thêm nhân viên thành công', { ma_nhan_vien: insertResult.insertId });
  } catch (error) {
    if (duplicateField(error, res, 'ma_tai_khoan', 'Tài khoản đã liên kết với nhân viên khác')) return;
    return sendError(res, 500, 'Lỗi khi thêm nhân viên', [(error as Error).message]);
  }
}

export async function updateNhanVien(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ma_tai_khoan, ho_ten, chuc_vu, so_dien_thoai, email, ngay_vao_lam, luong, trang_thai } = req.body;
    const accountError = await validateAccount(ma_tai_khoan, id);
    if (accountError) return res.status(400).json({ success: false, message: accountError, fieldErrors: { ma_tai_khoan: accountError } });

    const [rows] = await pool.query('SELECT * FROM nhan_vien WHERE ma_nhan_vien = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy nhân viên');

    await pool.query(
      `UPDATE nhan_vien SET ma_tai_khoan = CASE WHEN ? THEN ? ELSE ma_tai_khoan END, ho_ten = COALESCE(?, ho_ten), chuc_vu = COALESCE(?, chuc_vu), so_dien_thoai = COALESCE(?, so_dien_thoai), email = COALESCE(?, email), ngay_vao_lam = COALESCE(?, ngay_vao_lam), luong = COALESCE(?, luong), trang_thai = COALESCE(?, trang_thai) WHERE ma_nhan_vien = ?`,
      [ma_tai_khoan !== undefined, ma_tai_khoan || null, ho_ten ?? null, chuc_vu ?? null, so_dien_thoai ?? null, email ?? null, ngay_vao_lam || null, luong ?? null, trang_thai ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật nhân viên thành công', { ma_nhan_vien: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ma_tai_khoan', 'Tài khoản đã liên kết với nhân viên khác')) return;
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
    if (duplicateField(error, res, 'ma_tai_khoan', 'Tài khoản đã liên kết với nhân viên khác')) return;
    return sendError(res, 500, 'Lỗi khi xóa nhân viên', [(error as Error).message]);
  }
}
