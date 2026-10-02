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

    return sendSuccess(res, 'Gửi liên hệ thành công', { ma_lien_he: (result as any).insertId });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi gửi liên hệ', [(error as Error).message]);
  }
}

export async function getMyLienHe(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  try {
    const rows = await lienHeService.listMine(req.user.ma_tai_khoan);
    return sendSuccess(res, 'Liên hệ của tôi', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy liên hệ của bạn', [(error as Error).message]);
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
    const { trang_thai, phan_hoi } = req.body;
    if (trang_thai !== undefined && !['ChoPhanHoi', 'DaPhanHoi'].includes(trang_thai)) return sendError(res, 400, 'Trạng thái liên hệ không hợp lệ');
    if (phan_hoi !== undefined && phan_hoi !== null && (typeof phan_hoi !== 'string' || phan_hoi.trim().length > 5000)) return sendError(res, 400, 'Phản hồi tối đa 5.000 ký tự');
    if (trang_thai === undefined && phan_hoi === undefined) return sendError(res, 400, 'Không có thông tin cần cập nhật');

    const rows = await lienHeService.getById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy liên hệ');

    const normalizedReply = phan_hoi === undefined ? undefined : phan_hoi?.trim() || null;
    if (normalizedReply !== undefined) {
      await lienHeService.reply(Number(id), normalizedReply);
      await lienHeService.updateStatus([Number(id), normalizedReply ? 'DaPhanHoi' : 'ChoPhanHoi']);
    } else if (trang_thai !== undefined) await lienHeService.updateStatus([Number(id), trang_thai]);
    return sendSuccess(res, 'Cập nhật liên hệ thành công', { ma_lien_he: Number(id), trang_thai: normalizedReply !== undefined ? (normalizedReply ? 'DaPhanHoi' : 'ChoPhanHoi') : trang_thai, ...(normalizedReply !== undefined ? { phan_hoi: normalizedReply } : {}) });
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
