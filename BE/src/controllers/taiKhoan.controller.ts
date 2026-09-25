import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { taiKhoanService } from '../services/taiKhoan.service.js';

export async function getAllTaiKhoan(req: Request, res: Response) {
  try {
    const rows = await taiKhoanService.list();
    return sendSuccess(res, 'Danh sách tài khoản', rows);
  } catch (error) {
    if (duplicateField(error, res, 'email', 'Email đã được sử dụng')) return;
    return sendError(res, 500, 'Lỗi khi lấy danh sách tài khoản', [(error as Error).message]);
  }
}

export async function getTaiKhoanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await taiKhoanService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');
    return sendSuccess(res, 'Tài khoản được tìm thấy', result[0]);
  } catch (error) {
    if (duplicateField(error, res, 'email', 'Email đã được sử dụng')) return;
    return sendError(res, 500, 'Lỗi khi lấy tài khoản', [(error as Error).message]);
  }
}

export async function updateTaiKhoan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai } = req.body;
    if (Number(id) === req.user?.ma_tai_khoan && ((trang_thai && trang_thai !== 'HoatDong') || (vai_tro && vai_tro !== 'Admin'))) return sendError(res, 400, 'Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập');
    if (vai_tro && !['Admin', 'NhanVien', 'KhachHang'].includes(vai_tro)) return sendError(res, 400, 'Vai trò không hợp lệ');
    if (trang_thai && !['HoatDong', 'Khoa'].includes(trang_thai)) return sendError(res, 400, 'Trạng thái không hợp lệ');
    if (email) {
      const duplicates = await taiKhoanService.findByEmail(email, Number(id));
      if (duplicates.length) return res.status(409).json({ success: false, message: 'Email đã được sử dụng', fieldErrors: { email: 'Email đã được sử dụng' } });
    }

    const result = await taiKhoanService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');

    await taiKhoanService.update([Number(id), ho_ten ?? null, email ?? null, so_dien_thoai ?? null, dia_chi ?? null, vai_tro ?? null, trang_thai ?? null]);

    return sendSuccess(res, 'Cập nhật tài khoản thành công', { ma_tai_khoan: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'email', 'Email đã được sử dụng')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật tài khoản', [(error as Error).message]);
  }
}

export async function deleteTaiKhoan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (Number(id) === req.user?.ma_tai_khoan) return sendError(res, 400, 'Không thể tự xóa tài khoản đang đăng nhập');
    const result = await taiKhoanService.getById(Number(id));
    if (!result.length) return sendError(res, 404, 'Không tìm thấy tài khoản');

    await taiKhoanService.remove(Number(id));
    return sendSuccess(res, 'Xóa tài khoản thành công', { ma_tai_khoan: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'email', 'Email đã được sử dụng')) return;
    if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') return sendError(res, 409, 'Tài khoản có đơn hàng, không thể xóa. Hãy khóa tài khoản thay thế.');
    return sendError(res, 500, 'Lỗi khi xóa tài khoản', [(error as Error).message]);
  }
}
