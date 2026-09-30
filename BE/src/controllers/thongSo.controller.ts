import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import * as thongSoService from '../services/thongSo.service.js';

export async function getNhomThongSo(_req: Request, res: Response) {
  try {
    const groups = await thongSoService.listNhomThongSo();
    return sendSuccess(res, 'Danh sách nhóm thông số', groups);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy nhóm thông số', [(error as Error).message]);
  }
}

export async function getAllThongSo(req: Request, res: Response) {
  try {
    const { ma_nhom_thong_so, ma_danh_muc } = req.query;
    const filters = {
      ma_nhom_thong_so: ma_nhom_thong_so ? Number(ma_nhom_thong_so) : undefined,
      ma_danh_muc: ma_danh_muc ? Number(ma_danh_muc) : undefined,
    };
    const specs = await thongSoService.listThongSo(filters);
    return sendSuccess(res, 'Danh sách thông số', specs);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy danh sách thông số', [(error as Error).message]);
  }
}

export async function getThongSoByDanhMuc(req: Request, res: Response) {
  try {
    const categoryId = Number(req.params.id || req.params.ma_danh_muc);
    if (!categoryId || Number.isNaN(categoryId)) {
      return sendError(res, 400, 'Mã danh mục không hợp lệ');
    }
    const specs = await thongSoService.listThongSoByDanhMuc(categoryId);
    return sendSuccess(res, 'Danh sách thông số theo danh mục', specs);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy thông số theo danh mục', [(error as Error).message]);
  }
}

export async function getThongSoBySanPham(req: Request, res: Response) {
  try {
    const productId = Number(req.params.id || req.params.ma_san_pham);
    if (!productId || Number.isNaN(productId)) {
      return sendError(res, 400, 'Mã sản phẩm không hợp lệ');
    }
    const specs = await thongSoService.getThongSoBySanPham(productId);
    return sendSuccess(res, 'Thông số kỹ thuật sản phẩm', specs);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi lấy thông số sản phẩm', [(error as Error).message]);
  }
}

export async function addThongSoToDanhMuc(req: Request, res: Response) {
  try {
    const categoryId = Number(req.params.id || req.params.ma_danh_muc);
    const { ma_thong_so, bat_buoc, thu_tu_hien_thi } = req.body;

    if (!categoryId || Number.isNaN(categoryId)) {
      return sendError(res, 400, 'Mã danh mục không hợp lệ');
    }
    if (!ma_thong_so || Number.isNaN(Number(ma_thong_so))) {
      return sendError(res, 400, 'Mã thông số không hợp lệ');
    }

    await thongSoService.addThongSoToDanhMuc(
      categoryId,
      Number(ma_thong_so),
      Boolean(bat_buoc),
      thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : 0
    );

    const updated = await thongSoService.listThongSoByDanhMuc(categoryId);
    return sendSuccess(res, 'Gán thông số vào danh mục thành công', updated);
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi gán thông số vào danh mục', [(error as Error).message]);
  }
}

export async function updateThongSoInDanhMuc(req: Request, res: Response) {
  try {
    const categoryId = Number(req.params.id || req.params.ma_danh_muc);
    const specId = Number(req.params.specId || req.params.ma_thong_so);
    const { bat_buoc, thu_tu_hien_thi } = req.body;

    if (!categoryId || Number.isNaN(categoryId)) {
      return sendError(res, 400, 'Mã danh mục không hợp lệ');
    }
    if (!specId || Number.isNaN(specId)) {
      return sendError(res, 400, 'Mã thông số không hợp lệ');
    }

    await thongSoService.updateThongSoInDanhMuc(categoryId, specId, {
      bat_buoc: bat_buoc !== undefined ? Boolean(bat_buoc) : undefined,
      thu_tu_hien_thi: thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : undefined,
    });

    return sendSuccess(res, 'Cập nhật cấu hình thông số trong danh mục thành công', { success: true });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi cập nhật thông số trong danh mục', [(error as Error).message]);
  }
}

export async function removeThongSoFromDanhMuc(req: Request, res: Response) {
  try {
    const categoryId = Number(req.params.id || req.params.ma_danh_muc);
    const specId = Number(req.params.specId || req.params.ma_thong_so);

    if (!categoryId || Number.isNaN(categoryId)) {
      return sendError(res, 400, 'Mã danh mục không hợp lệ');
    }
    if (!specId || Number.isNaN(specId)) {
      return sendError(res, 400, 'Mã thông số không hợp lệ');
    }

    await thongSoService.removeThongSoFromDanhMuc(categoryId, specId);
    return sendSuccess(res, 'Đã xóa thông số khỏi danh mục thành công', { success: true });
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa thông số khỏi danh mục', [(error as Error).message]);
  }
}

export async function createThongSo(req: Request, res: Response) {
  try {
    const { ma_nhom_thong_so, ten_thong_so, kieu_du_lieu, don_vi, cho_phep_loc, thu_tu_hien_thi, ma_danh_muc, bat_buoc } = req.body;

    if (!ma_nhom_thong_so || Number.isNaN(Number(ma_nhom_thong_so))) {
      return sendError(res, 400, 'Vui lòng chọn nhóm thông số');
    }
    if (!ten_thong_so || typeof ten_thong_so !== 'string' || !ten_thong_so.trim()) {
      return sendError(res, 400, 'Tên thông số không được để trống');
    }

    const newId = await thongSoService.createThongSo({
      ma_nhom_thong_so: Number(ma_nhom_thong_so),
      ten_thong_so: ten_thong_so.trim(),
      kieu_du_lieu,
      don_vi: don_vi || null,
      cho_phep_loc: Boolean(cho_phep_loc),
      thu_tu_hien_thi: thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : 0,
    });

    // If an optional ma_danh_muc is provided, immediately link it
    if (ma_danh_muc && !Number.isNaN(Number(ma_danh_muc))) {
      await thongSoService.addThongSoToDanhMuc(
        Number(ma_danh_muc),
        newId,
        Boolean(bat_buoc),
        thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : 0
      );
    }

    return sendSuccess(res, 'Tạo thông số kỹ thuật thành công', { ma_thong_so: newId });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Thông số với tên này đã tồn tại trong nhóm');
    }
    return sendError(res, 500, 'Lỗi khi tạo thông số kỹ thuật', [(error as Error).message]);
  }
}

export async function updateThongSo(req: Request, res: Response) {
  try {
    const specId = Number(req.params.id);
    if (!specId || Number.isNaN(specId)) {
      return sendError(res, 400, 'Mã thông số không hợp lệ');
    }

    const { ma_nhom_thong_so, ten_thong_so, kieu_du_lieu, don_vi, cho_phep_loc, thu_tu_hien_thi, trang_thai } = req.body;

    await thongSoService.updateThongSo(specId, {
      ma_nhom_thong_so: ma_nhom_thong_so !== undefined ? Number(ma_nhom_thong_so) : undefined,
      ten_thong_so: ten_thong_so !== undefined ? String(ten_thong_so).trim() : undefined,
      kieu_du_lieu,
      don_vi: don_vi !== undefined ? (don_vi?.trim() || null) : undefined,
      cho_phep_loc: cho_phep_loc !== undefined ? Boolean(cho_phep_loc) : undefined,
      thu_tu_hien_thi: thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : undefined,
      trang_thai: trang_thai !== undefined ? Boolean(trang_thai) : undefined,
    });

    return sendSuccess(res, 'Cập nhật thông số kỹ thuật thành công', { success: true });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Thông số với tên này đã tồn tại trong nhóm');
    }
    return sendError(res, 500, 'Lỗi khi cập nhật thông số kỹ thuật', [(error as Error).message]);
  }
}

export async function deleteThongSo(req: Request, res: Response) {
  try {
    const specId = Number(req.params.id);
    if (!specId || Number.isNaN(specId)) {
      return sendError(res, 400, 'Mã thông số không hợp lệ');
    }

    const result = await thongSoService.deleteThongSo(specId);
    return sendSuccess(
      res,
      result.softDeleted
        ? 'Thông số đã được ẩn do đang có sản phẩm sử dụng'
        : 'Đã xóa thông số kỹ thuật hoàn toàn khỏi hệ thống',
      result
    );
  } catch (error) {
    return sendError(res, 500, 'Lỗi khi xóa thông số kỹ thuật', [(error as Error).message]);
  }
}

export async function createNhomThongSo(req: Request, res: Response) {
  try {
    const { ten_nhom_thong_so, thu_tu_hien_thi } = req.body;
    if (!ten_nhom_thong_so || typeof ten_nhom_thong_so !== 'string' || !ten_nhom_thong_so.trim()) {
      return sendError(res, 400, 'Tên nhóm thông số không được để trống');
    }

    const newId = await thongSoService.createNhomThongSo({
      ten_nhom_thong_so: ten_nhom_thong_so.trim(),
      thu_tu_hien_thi: thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : 0,
    });

    return sendSuccess(res, 'Tạo nhóm thông số thành công', { ma_nhom_thong_so: newId });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Tên nhóm thông số này đã tồn tại');
    }
    return sendError(res, 500, 'Lỗi khi tạo nhóm thông số', [(error as Error).message]);
  }
}

export async function updateNhomThongSo(req: Request, res: Response) {
  try {
    const groupId = Number(req.params.id);
    if (!groupId || Number.isNaN(groupId)) {
      return sendError(res, 400, 'Mã nhóm thông số không hợp lệ');
    }

    const { ten_nhom_thong_so, thu_tu_hien_thi, trang_thai } = req.body;
    await thongSoService.updateNhomThongSo(groupId, {
      ten_nhom_thong_so: ten_nhom_thong_so !== undefined ? String(ten_nhom_thong_so).trim() : undefined,
      thu_tu_hien_thi: thu_tu_hien_thi !== undefined ? Number(thu_tu_hien_thi) : undefined,
      trang_thai: trang_thai !== undefined ? Boolean(trang_thai) : undefined,
    });

    return sendSuccess(res, 'Cập nhật nhóm thông số thành công', { success: true });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return sendError(res, 409, 'Tên nhóm thông số này đã tồn tại');
    }
    return sendError(res, 500, 'Lỗi khi cập nhật nhóm thông số', [(error as Error).message]);
  }
}
