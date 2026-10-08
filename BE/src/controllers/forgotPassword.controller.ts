import type { Request, Response } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function forgotPassword(req: Request, res: Response) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const phone = typeof req.body?.so_dien_thoai === 'string' ? req.body.so_dien_thoai.replace(/[\s().-]/g, '').replace(/^\+84/, '0') : '';
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^0[35789]\d{8}$/.test(phone)) return sendError(res, 400, 'Vui lòng nhập email và số điện thoại hợp lệ đã đăng ký.');
  let connection: PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // Both values must belong to the same active customer; management accounts cannot be reset here.
    const [rows] = await connection.query("SELECT ma_tai_khoan FROM tai_khoan WHERE email=? AND so_dien_thoai=? AND vai_tro='KhachHang' AND trang_thai='HoatDong' FOR UPDATE", [email,phone]);
    const account = (rows as { ma_tai_khoan: number }[])[0];
    if (!account) {
      await connection.rollback();
      return sendError(res, 400, 'Email và số điện thoại không khớp với tài khoản khách hàng đang hoạt động.');
    }
    const newPassword = '12345678';
    const hash = await bcrypt.hash(newPassword, 12);
    await connection.execute('UPDATE tai_khoan SET mat_khau=?,token_version=token_version+1 WHERE ma_tai_khoan=?', [hash,account.ma_tai_khoan]);
    await connection.execute('DELETE FROM auth_sessions WHERE ma_tai_khoan=?', [account.ma_tai_khoan]);
    await connection.commit();
    res.set('Cache-Control', 'no-store');
    return sendSuccess(res, 'Đặt lại mật khẩu thành công. Mật khẩu mới của bạn là 12345678.', { new_password: newPassword });
  } catch {
    await connection?.rollback();
    return sendError(res, 503, 'Chưa thể đặt lại mật khẩu. Vui lòng thử lại.');
  } finally { connection?.release(); }
}
