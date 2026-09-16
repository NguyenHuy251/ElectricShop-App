import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllDanhMuc(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM danh_muc ORDER BY ma_danh_muc DESC');
    return sendSuccess(res, 'Danh sách danh mục', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh mục', [(error as Error).message]);
  }
}

export async function getDanhMucById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM danh_muc WHERE ma_danh_muc = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');
    return sendSuccess(res, 'Danh mục được tìm thấy', result[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh mục', [(error as Error).message]);
  }
}

export async function createDanhMuc(req: Request, res: Response) {
  try {
    const { ten_danh_muc, mo_ta, trang_thai } = req.body;
    if (!ten_danh_muc) return sendError(res, 400, 'Tên danh mục là bắt buộc');

    const [result] = await pool.execute(
      'INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (?, ?, ?)',
      [ten_danh_muc, mo_ta || null, trang_thai ?? true],
    );

    const insertResult = result as { insertId: number };
    return sendSuccess(res, 'Thêm danh mục thành công', { ma_danh_muc: insertResult.insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi thêm danh mục', [(error as Error).message]);
  }
}

export async function updateDanhMuc(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ten_danh_muc, mo_ta, trang_thai } = req.body;

    const [rows] = await pool.query('SELECT * FROM danh_muc WHERE ma_danh_muc = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');

    await pool.query(
      'UPDATE danh_muc SET ten_danh_muc = COALESCE(?, ten_danh_muc), mo_ta = COALESCE(?, mo_ta), trang_thai = COALESCE(?, trang_thai) WHERE ma_danh_muc = ?',
      [ten_danh_muc ?? null, mo_ta ?? null, trang_thai ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật danh mục thành công', { ma_danh_muc: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật danh mục', [(error as Error).message]);
  }
}

export async function deleteDanhMuc(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM danh_muc WHERE ma_danh_muc = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');

    await pool.query('DELETE FROM danh_muc WHERE ma_danh_muc = ?', [id]);
    return sendSuccess(res, 'Xóa danh mục thành công', { ma_danh_muc: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa danh mục', [(error as Error).message]);
  }
}
