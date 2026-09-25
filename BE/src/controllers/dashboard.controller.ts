import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.js';
import { getDashboardData } from '../services/dashboard.service.js';

export async function getDashboard(req: Request, res: Response) {
  try {
    const { summary, monthly } = await getDashboardData();
    const data = summary[0] as any;
    return sendSuccess(res, 'Dashboard thống kê', {
      doanh_thu_theo_thang: monthly,
      so_don_da_xac_nhan: Number(data.so_don_da_xac_nhan || 0),
      tong_san_pham: Number(data.tong_san_pham || 0),
      tong_khach_hang: Number(data.tong_khach_hang || 0),
      tong_nhan_vien: Number(data.tong_nhan_vien || 0),
      tong_don_hang: Number(data.tong_don_hang || 0),
      tong_doanh_thu: Number(data.tong_doanh_thu || 0),
      so_don_cho_xac_nhan: Number(data.so_don_cho_xac_nhan || 0),
      so_don_dang_giao: Number(data.so_don_dang_giao || 0),
      so_don_da_giao: Number(data.so_don_da_giao || 0),
      so_don_da_huy: Number(data.so_don_da_huy || 0),
    });
  } catch (error) {
    return sendError(res, 500, 'Lỗi dashboard', [(error as Error).message]);
  }
}
