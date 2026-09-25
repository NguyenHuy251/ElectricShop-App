import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import * as donHangService from '../services/donHang.service.js';

export async function createDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao_hang, phuong_thuc_thanh_toan, ghi_chu } = req.body;
    if (!ho_ten_nguoi_nhan || !so_dien_thoai || !dia_chi_giao_hang) {
      return sendError(res, 400, 'Thiếu thông tin đặt hàng');
    }

    const result = await donHangService.createDonHang([
      req.user.ma_tai_khoan, ho_ten_nguoi_nhan, so_dien_thoai, dia_chi_giao_hang,
      phuong_thuc_thanh_toan || 'ThanhToanKhiNhanHang', ghi_chu || null,
    ]);
    const order = result[0];
    return sendSuccess(res, 'Đặt hàng thành công', order);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi tạo đơn hàng', [(error as Error).message]);
  }
}

export async function getDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const data = await donHangService.listDonHang(req.user.ma_tai_khoan, req.user.vai_tro === 'KhachHang');
    const result = data.orders as any[];
    for (const order of result) order.items = data.items.filter(item => item.ma_don_hang === order.ma_don_hang);

    return sendSuccess(res, 'Danh sách đơn hàng', result);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy đơn hàng', [(error as Error).message]);
  }
}

export async function getDonHangById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const data = await donHangService.getDonHangById(Number(id));
    const order = data.order[0] as any;
    if (!order) return sendError(res, 404, 'Không tìm thấy đơn hàng');

    if (req.user.vai_tro === 'KhachHang' && order.ma_tai_khoan !== req.user.ma_tai_khoan) {
      return sendError(res, 403, 'Bạn không có quyền xem đơn hàng này');
    }

    order.items = data.items;

    return sendSuccess(res, 'Chi tiết đơn hàng', order);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy chi tiết đơn hàng', [(error as Error).message]);
  }
}

export async function updateTrangThaiDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    const result = await donHangService.donHangService.updateStatus([Number(id), trang_thai]);
    return sendSuccess(res, 'Cập nhật trạng thái đơn hàng thành công', result[0] || { ma_don_hang: Number(id), trang_thai });
  } catch (error) {
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Khong tim thay')) return sendError(res, 404, 'Không tìm thấy đơn hàng');
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('khong hop le')) return sendError(res, 409, 'Không thể chuyển trạng thái đơn hàng theo luồng này. Hãy tải lại danh sách.');
    return sendError(res, 500, 'Lỗi khi cập nhật trạng thái đơn hàng', [(error as Error).message]);
  }
}

export async function cancelDonHang(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');

    const { id } = req.params;
    const result = await donHangService.donHangService.cancel([Number(id), req.user.ma_tai_khoan]);
    return sendSuccess(res, 'Huỷ đơn hàng thành công', result[0] || { ma_don_hang: Number(id), trang_thai: 'DaHuy' });
  } catch (error) {
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Khong tim thay')) return sendError(res, 404, 'Không tìm thấy đơn hàng của bạn');
    if ((error as { sqlMessage?: string }).sqlMessage?.includes('Chi huy')) return sendError(res, 400, 'Chỉ có thể huỷ đơn hàng đang chờ xác nhận');
    return sendError(res, 500, 'Lỗi khi huỷ đơn hàng', [(error as Error).message]);
  }
}

export async function deleteDonHang(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = await donHangService.getDonHangById(Number(id));
    if (!data.order.length) return sendError(res, 404, 'Không tìm thấy đơn hàng');
    if (!['DaGiao', 'DaHuy'].includes(String((data.order[0] as any).trang_thai))) return sendError(res, 409, 'Chỉ được xóa đơn đã giao hoặc đã hủy');
    await donHangService.donHangService.remove(Number(id));
    return sendSuccess(res, 'Xóa đơn hàng thành công', { ma_don_hang: Number(id) });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa đơn hàng', [(error as Error).message]);
  }
}
