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
