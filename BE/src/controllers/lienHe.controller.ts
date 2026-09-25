import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { lienHeService } from '../services/lienHe.service.js';

export async function createLienHe(req: AuthRequest, res: Response) {
  try {
    const { ho_ten, email, so_dien_thoai, tieu_de, noi_dung } = req.body;
    if (!ho_ten || !email || !tieu_de || !noi_dung) {
      return sendError(res, 400, 'Thiếu thông tin liên hệ bắt buộc');
    }

    const maTaiKhoan = req.user?.ma_tai_khoan ?? null;
    const result = await lienHeService.create([maTaiKhoan, ho_ten, email, so_dien_thoai || null, tieu_de, noi_dung]);

    return sendSuccess(res, 'Gửi liên hệ thành công', { ma_lien_he: (result[0] as any).insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi gửi liên hệ', [(error as Error).message]);
  }
}

export async function getAllLienHe(req: Request, res: Response) {
  try {
    const rows = await lienHeService.list();
    return sendSuccess(res, 'Danh sách liên hệ', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách liên hệ', [(error as Error).message]);
  }
}

export async function getLienHeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rows = await lienHeService.getById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy liên hệ');
    return sendSuccess(res, 'Chi tiết liên hệ', rows[0]);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy liên hệ', [(error as Error).message]);
  }
}

export async function updateLienHe(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    if (!['ChuaXuLy', 'DangXuLy', 'DaXuLy'].includes(trang_thai)) return sendError(res, 400, 'Trạng thái liên hệ không hợp lệ');

    const rows = await lienHeService.getById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy liên hệ');

    await lienHeService.updateStatus([Number(id), trang_thai]);
    return sendSuccess(res, 'Cập nhật trạng thái liên hệ thành công', { ma_lien_he: Number(id), trang_thai });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật liên hệ', [(error as Error).message]);
  }
}

export async function deleteLienHe(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rows = await lienHeService.getById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy liên hệ');

    await lienHeService.remove(Number(id));
    return sendSuccess(res, 'Xóa liên hệ thành công', { ma_lien_he: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa liên hệ', [(error as Error).message]);
  }
}
