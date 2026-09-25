import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { pool } from '../config/database.js';

export interface AuthRequest extends Request {
  user?: {
    ma_tai_khoan: number;
    ten_dang_nhap: string;
    vai_tro: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token không hợp lệ hoặc thiếu token');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return sendError(res, 401, 'Token không hợp lệ hoặc đã hết hạn');
  }
  try {
    const [rows] = await pool.query('SELECT ma_tai_khoan, ten_dang_nhap, vai_tro, trang_thai FROM tai_khoan WHERE ma_tai_khoan = ?', [decoded.ma_tai_khoan]);
    const user = (rows as { ma_tai_khoan: number; ten_dang_nhap: string; vai_tro: string; trang_thai: string }[])[0];
    if (!user || user.trang_thai !== 'HoatDong') return sendError(res, 401, 'Tài khoản không tồn tại hoặc đã bị khóa');
    req.user = { ma_tai_khoan: user.ma_tai_khoan, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro };
    next();
  } catch { return sendError(res, 503, 'Không thể xác thực tài khoản. Vui lòng thử lại.'); }
}
