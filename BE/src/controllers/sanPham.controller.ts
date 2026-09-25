import { duplicateField } from '../utils/adminErrors.js';
import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import * as sanPhamService from '../services/sanPham.service.js';

export async function getAllSanPham(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, search = '', ma_danh_muc, ma_thuong_hieu, min_price, max_price } = req.query;

    if (!Number.isInteger(Number(page)) || Number(page) < 1 || !Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) return sendError(res, 400, 'Phân trang không hợp lệ');
    const offset = (Number(page) - 1) * Number(limit);
    const searchTerm = String(search || '').trim();

    const result = await sanPhamService.listSanPham([
      searchTerm, ma_danh_muc ? Number(ma_danh_muc) : null, ma_thuong_hieu ? Number(ma_thuong_hieu) : null,
      min_price ? Number(min_price) : null, max_price ? Number(max_price) : null, Number(limit), offset,
    ]);
    const rows = result.rows;
    const total = result.count[0]?.total ?? 0;

    return sendSuccess(res, 'Danh sách sản phẩm', rows, {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(Number(total) / Number(limit)),
    });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy danh sách sản phẩm', [(error as Error).message]);
  }
}

export async function getSanPhamById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rows = await sanPhamService.getSanPhamById(Number(id));

    const result = rows as any[];
    if (!result.length) return sendError(res, 404, 'Không tìm thấy sản phẩm');

    return sendSuccess(res, 'Sản phẩm được tìm thấy', result[0]);
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi lấy sản phẩm', [(error as Error).message]);
  }
}

export async function createSanPham(req: Request, res: Response) {
  try {
    const {
      ma_danh_muc,
      ma_thuong_hieu,
      ma_san_pham_code,
      ten_san_pham,
      mo_ta,
      gia_nhap,
      gia_ban,
      so_luong,
      bao_hanh,
      hinh_anh,
      trang_thai,
      cong_suat,
      dung_tich,
      kich_thuoc,
      mau_sac,
      xuat_xu,
      thong_so_khac,
    } = req.body;

    if (!ma_danh_muc || !ma_thuong_hieu || !ma_san_pham_code || !ten_san_pham || !gia_ban) {
      return sendError(res, 400, 'Thiếu thông tin sản phẩm bắt buộc');
    }

    const existing = await sanPhamService.findSanPhamByCode(ma_san_pham_code);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Mã sản phẩm đã tồn tại', fieldErrors: { ma_san_pham_code: 'Mã sản phẩm đã tồn tại' } });
    }

    const result = await sanPhamService.createSanPham([
      ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, mo_ta || null, gia_nhap ?? 0, gia_ban,
      so_luong ?? 0, bao_hanh ?? 12, hinh_anh || null, trang_thai || 'DangBan', cong_suat || null,
      dung_tich || null, kich_thuoc || null, mau_sac || null, xuat_xu || null, thong_so_khac || null,
    ]);
    const maSanPham = (result[0] as { insertId: number }).insertId;

    return sendSuccess(res, 'Thêm sản phẩm thành công', { ma_san_pham: maSanPham });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi thêm sản phẩm', [(error as Error).message]);
  }
}

export async function updateSanPham(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      ma_danh_muc,
      ma_thuong_hieu,
      ma_san_pham_code,
      ten_san_pham,
      mo_ta,
      gia_nhap,
      gia_ban,
      so_luong,
      bao_hanh,
      hinh_anh,
      trang_thai,
      cong_suat,
      dung_tich,
      kich_thuoc,
      mau_sac,
      xuat_xu,
      thong_so_khac,
    } = req.body;

    const rows = await sanPhamService.getSanPhamById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy sản phẩm');
    await sanPhamService.updateSanPham([
      Number(id), ma_danh_muc ?? null, ma_thuong_hieu ?? null, ma_san_pham_code ?? null, ten_san_pham ?? null,
      mo_ta ?? null, gia_nhap ?? null, gia_ban ?? null, so_luong ?? null, bao_hanh ?? null, hinh_anh ?? null,
      trang_thai ?? null, cong_suat ?? null, dung_tich ?? null, kich_thuoc ?? null, mau_sac ?? null, xuat_xu ?? null, thong_so_khac ?? null,
    ]);

    return sendSuccess(res, 'Cập nhật sản phẩm thành công', { ma_san_pham: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    return sendError(res, 500, 'Lỗi khi cập nhật sản phẩm', [(error as Error).message]);
  }
}

export async function deleteSanPham(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const rows = await sanPhamService.getSanPhamById(Number(id));
    if (!rows.length) return sendError(res, 404, 'Không tìm thấy sản phẩm');
    await sanPhamService.deleteSanPham(Number(id));
    return sendSuccess(res, 'Xóa sản phẩm thành công', { ma_san_pham: Number(id) });
  } catch (error) {
    if (duplicateField(error, res, 'ma_san_pham_code', 'Mã sản phẩm đã tồn tại')) return;
    if (['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'].includes((error as { code?: string }).code || '')) return sendError(res, 409, 'Sản phẩm đang được sử dụng trong đơn hàng, không thể xóa.');
    return sendError(res, 500, 'Lỗi khi xóa sản phẩm', [(error as Error).message]);
  }
}
