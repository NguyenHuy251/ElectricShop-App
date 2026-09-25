import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { danhGiaService, listDanhGia } from '../services/danhGia.service.js';

export async function getAllDanhGia(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1), limit = Number(req.query.limit || 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return sendError(res, 400, 'Phân trang không hợp lệ');
    let productId: number | null = null, stars: number | null = null;
    if (req.query.ma_san_pham) {
      const parsedProductId = Number(req.query.ma_san_pham);
      if (!Number.isInteger(parsedProductId) || parsedProductId < 1) return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
      productId = parsedProductId;
    }
    if (req.query.so_sao) {
      const parsedStars = Number(req.query.so_sao);
      if (!Number.isInteger(parsedStars) || parsedStars < 1 || parsedStars > 5) return sendError(res, 400, 'Số sao không hợp lệ');
      stars = parsedStars;
    }
    const data = await listDanhGia([productId, stars, limit, (page - 1) * limit]);
    const total = Number((data.count as any[])[0]?.total || 0);
    const rows = data.rows;
    return sendSuccess(res, 'Danh sách đánh giá', rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return sendError(res, 500, 'Không thể tải đánh giá'); }
}


export async function getDanhGiaBySanPham(req: Request, res: Response) {
  try {
    const { ma_san_pham } = req.params;
    const rows = await danhGiaService.listByProduct(Number(ma_san_pham));

    return sendSuccess(res, 'Danh sách đánh giá', rows);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy đánh giá', [(error as Error).message]);
  }
}

export async function createDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ma_san_pham, so_sao, noi_dung } = req.body;
    if (!ma_san_pham || !so_sao) return sendError(res, 400, 'Thiếu thông tin đánh giá');
    if (Number(so_sao) < 1 || Number(so_sao) > 5) return sendError(res, 400, 'Số sao phải từ 1 đến 5');

    const result = await danhGiaService.create([ma_san_pham, req.user.ma_tai_khoan, so_sao, noi_dung || null]);

    return sendSuccess(res, 'Gửi đánh giá thành công', { ma_danh_gia: (result[0] as any).insertId });
  } catch (error) {
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('San pham khong ton tai')) return sendError(res, 404, 'Sản phẩm không tồn tại');
    return sendError(res, 500, 'Lỗi khi đánh giá sản phẩm', [(error as Error).message]);
  }
}

export async function updateDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const { so_sao, noi_dung } = req.body;

    const rows = await danhGiaService.getById(Number(id));
    if (!rows.some(review => review.ma_danh_gia === Number(id) && review.ma_tai_khoan === req.user?.ma_tai_khoan)) return sendError(res, 404, 'Không tìm thấy đánh giá của bạn');
    await danhGiaService.update([Number(id), so_sao ?? null, noi_dung ?? null]);

    return sendSuccess(res, 'Cập nhật đánh giá thành công', { ma_danh_gia: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật đánh giá', [(error as Error).message]);
  }
}

export async function deleteDanhGia(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const isStaff = ['Admin', 'NhanVien'].includes(req.user.vai_tro);
    const rows = await danhGiaService.getById(Number(id));
    if (!isStaff && !rows.some(review => review.ma_danh_gia === Number(id) && review.ma_tai_khoan === req.user?.ma_tai_khoan)) return sendError(res, 404, 'Không tìm thấy đánh giá của bạn');
    if (isStaff && !rows.some(review => review.ma_danh_gia === Number(id))) return sendError(res, 404, 'Không tìm thấy đánh giá của bạn');
    await danhGiaService.remove(Number(id));
    return sendSuccess(res, 'Xóa đánh giá thành công', { ma_danh_gia: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa đánh giá', [(error as Error).message]);
  }
}
