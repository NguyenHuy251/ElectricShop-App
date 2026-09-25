import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import { danhMucService } from '../services/danhMuc.service.js';

export async function getAllDanhMuc(req: Request, res: Response) {
  try {
    const rows = await danhMucService.list();
    return sendSuccess(res, 'Danh sách danh mục', rows);
  } catch (error) {
    if (duplicateField(error, res, 'ten_danh_muc', 'Tên danh mục đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy danh mục', [(error as Error).message]);
  }
}

export async function getDanhMucById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await danhMucService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');
    return sendSuccess(res, 'Danh mục được tìm thấy', result[0]);
  } catch (error) {
    if (duplicateField(error, res, 'ten_danh_muc', 'Tên danh mục đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy danh mục', [(error as Error).message]);
  }
}

export async function createDanhMuc(req: Request, res: Response) {
  try {
    const { ten_danh_muc, mo_ta, trang_thai } = req.body;
    if (!ten_danh_muc) return sendError(res, 400, 'Tên danh mục là bắt buộc');

    const result = await danhMucService.create([ten_danh_muc, mo_ta || null, trang_thai ?? true]);

    const insertResult = result[0] as { insertId: number };
    return sendSuccess(res, 'Thêm danh mục thành công', { ma_danh_muc: insertResult.insertId });
  } catch (error) {
    if (duplicateField(error, res, 'ten_danh_muc', 'Tên danh mục đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi thêm danh mục', [(error as Error).message]);
  }
}

export async function updateDanhMuc(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ten_danh_muc, mo_ta, trang_thai } = req.body;

    const result = await danhMucService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');

    await danhMucService.update([Number(id), ten_danh_muc ?? null, mo_ta ?? null, trang_thai ?? null]);

    return sendSuccess(res, 'Cập nhật danh mục thành công', { ma_danh_muc: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ten_danh_muc', 'Tên danh mục đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật danh mục', [(error as Error).message]);
  }
}

export async function deleteDanhMuc(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await danhMucService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy danh mục');

    await danhMucService.remove(Number(id));
    return sendSuccess(res, 'Xóa danh mục thành công', { ma_danh_muc: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ten_danh_muc', 'Tên danh mục đã tồn tại')) return;
    if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') return sendError(res, 409, 'Danh mục đang được sản phẩm sử dụng, không thể xóa.');
    return sendError(res, 500, 'Lỗi khi xóa danh mục', [(error as Error).message]);
  }
}
