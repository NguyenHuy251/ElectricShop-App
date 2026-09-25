import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import { thuongHieuService } from '../services/thuongHieu.service.js';

export async function getAllThuongHieu(req: Request, res: Response) {
  try {
    const rows = await thuongHieuService.list();
    return sendSuccess(res, 'Danh sách thương hiệu', rows);
  } catch (error) {
    if (duplicateField(error, res, 'ten_thuong_hieu', 'Tên thương hiệu đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy thương hiệu', [(error as Error).message]);
  }
}

export async function getThuongHieuById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await thuongHieuService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');
    return sendSuccess(res, 'Thương hiệu được tìm thấy', result[0]);
  } catch (error) {
    if (duplicateField(error, res, 'ten_thuong_hieu', 'Tên thương hiệu đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy thương hiệu', [(error as Error).message]);
  }
}

export async function createThuongHieu(req: Request, res: Response) {
  try {
    const { ten_thuong_hieu, quoc_gia, mo_ta } = req.body;
    if (!ten_thuong_hieu) return sendError(res, 400, 'Tên thương hiệu là bắt buộc');

    const result = await thuongHieuService.create([ten_thuong_hieu, quoc_gia || null, mo_ta || null]);

    const insertResult = result[0] as { insertId: number };
    return sendSuccess(res, 'Thêm thương hiệu thành công', { ma_thuong_hieu: insertResult.insertId });
  } catch (error) {
    if (duplicateField(error, res, 'ten_thuong_hieu', 'Tên thương hiệu đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi thêm thương hiệu', [(error as Error).message]);
  }
}

export async function updateThuongHieu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ten_thuong_hieu, quoc_gia, mo_ta } = req.body;

    const result = await thuongHieuService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');

    await thuongHieuService.update([Number(id), ten_thuong_hieu ?? null, quoc_gia ?? null, mo_ta ?? null]);

    return sendSuccess(res, 'Cập nhật thương hiệu thành công', { ma_thuong_hieu: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ten_thuong_hieu', 'Tên thương hiệu đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật thương hiệu', [(error as Error).message]);
  }
}

export async function deleteThuongHieu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await thuongHieuService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy thương hiệu');

    await thuongHieuService.remove(Number(id));
    return sendSuccess(res, 'Xóa thương hiệu thành công', { ma_thuong_hieu: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ten_thuong_hieu', 'Tên thương hiệu đã tồn tại')) return;
    if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') return sendError(res, 409, 'Thương hiệu đang được sản phẩm sử dụng, không thể xóa.');
    return sendError(res, 500, 'Lỗi khi xóa thương hiệu', [(error as Error).message]);
  }
}
