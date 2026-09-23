import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getDashboard(req: Request, res: Response) {
  try {
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM san_pham) AS tong_san_pham,
        (SELECT COUNT(*) FROM tai_khoan WHERE vai_tro = 'KhachHang') AS tong_khach_hang,
        (SELECT COUNT(*) FROM nhan_vien) AS tong_nhan_vien,
        (SELECT COUNT(*) FROM don_hang) AS tong_don_hang,
        (SELECT COALESCE(SUM(tong_tien), 0) FROM don_hang WHERE trang_thai = 'DaGiao') AS tong_doanh_thu,
        (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'DaXacNhan') AS so_don_da_xac_nhan,
        (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'ChoXacNhan') AS so_don_cho_xac_nhan,
        (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'DangGiao') AS so_don_dang_giao,
        (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'DaGiao') AS so_don_da_giao,
        (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'DaHuy') AS so_don_da_huy
    `);

    const data = (stats as any[])[0];
    const [monthly] = await pool.query(`SELECT DATE_FORMAT(ngay_dat, '%Y-%m') AS thang, SUM(tong_tien) AS doanh_thu FROM don_hang WHERE trang_thai = 'DaGiao' AND ngay_dat >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01') GROUP BY DATE_FORMAT(ngay_dat, '%Y-%m') ORDER BY thang`);
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
