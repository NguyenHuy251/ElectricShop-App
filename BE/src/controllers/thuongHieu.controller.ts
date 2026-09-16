import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAllThuongHieu(req: Request, res: Response) {
  try {
    const [rows] = await pool.query('SELECT * FROM thuong_hieu ORDER BY ma_thuong_hieu DESC');
    return sendSuccess(res, 'Danh sách thương hiệu', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy thương hiệu', [(error as Error).message]);
  }
}

export async function getThuongHieuById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM thuong_hieu WHERE ma_thuong_hieu = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');
    return sendSuccess(res, 'Thương hiệu được tìm thấy', result[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy thương hiệu', [(error as Error).message]);
  }
}

export async function createThuongHieu(req: Request, res: Response) {
  try {
    const { ten_thuong_hieu, quoc_gia, mo_ta } = req.body;
    if (!ten_thuong_hieu) return sendError(res, 400, 'Tên thương hiệu là bắt buộc');

    const [result] = await pool.execute(
      'INSERT INTO thuong_hieu (ten_thuong_hieu, quoc_gia, mo_ta) VALUES (?, ?, ?)',
      [ten_thuong_hieu, quoc_gia || null, mo_ta || null],
    );

    const insertResult = result as { insertId: number };
    return sendSuccess(res, 'Thêm thương hiệu thành công', { ma_thuong_hieu: insertResult.insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi thêm thương hiệu', [(error as Error).message]);
  }
}

export async function updateThuongHieu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ten_thuong_hieu, quoc_gia, mo_ta } = req.body;

    const [rows] = await pool.query('SELECT * FROM thuong_hieu WHERE ma_thuong_hieu = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');

    await pool.query(
      'UPDATE thuong_hieu SET ten_thuong_hieu = COALESCE(?, ten_thuong_hieu), quoc_gia = COALESCE(?, quoc_gia), mo_ta = COALESCE(?, mo_ta) WHERE ma_thuong_hieu = ?',
      [ten_thuong_hieu ?? null, quoc_gia ?? null, mo_ta ?? null, id],
    );

    return sendSuccess(res, 'Cập nhật thương hiệu thành công', { ma_thuong_hieu: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật thương hiệu', [(error as Error).message]);
  }
}

export async function deleteThuongHieu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM thuong_hieu WHERE ma_thuong_hieu = ?', [id]);
    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');

    await pool.query('DELETE FROM thuong_hieu WHERE ma_thuong_hieu = ?', [id]);
    return sendSuccess(res, 'Xóa thương hiệu thành công', { ma_thuong_hieu: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa thương hiệu', [(error as Error).message]);
  }
}
