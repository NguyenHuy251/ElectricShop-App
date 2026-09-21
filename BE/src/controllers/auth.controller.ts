import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { signToken } from '../utils/jwt.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function register(req: Request, res: Response) {
  try {
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi } = req.body;

    if (!ten_dang_nhap || !mat_khau || !ho_ten || !email) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }

    const [existing] = await pool.query('SELECT ma_tai_khoan FROM tai_khoan WHERE ten_dang_nhap = ? OR email = ?', [ten_dang_nhap, email]);
    const rows = existing as Array<{ ma_tai_khoan: number }>;
    if (rows.length > 0) {
      return sendError(res, 409, 'Tên đăng nhập hoặc email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(mat_khau, 10);
    const [result] = await pool.execute(
      `INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai, ngay_tao)
       VALUES (?, ?, ?, ?, ?, ?, 'KhachHang', 'HoatDong', NOW())`,
      [ten_dang_nhap, hashedPassword, ho_ten, email, so_dien_thoai || null, dia_chi || null],
    );

    const insertResult = result as { insertId: number };
    const user = {
      ma_tai_khoan: insertResult.insertId,
      ten_dang_nhap,
      ho_ten,
      email,
      so_dien_thoai: so_dien_thoai || null,
      dia_chi: dia_chi || null,
      vai_tro: 'KhachHang',
      trang_thai: 'HoatDong',
    };

    const token = signToken({ ma_tai_khoan: user.ma_tai_khoan, ten_dang_nhap, vai_tro: user.vai_tro });

    return sendSuccess(res, 'Đăng ký thành công', { token, user });
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Lỗi khi đăng ký', [(error as Error).message]);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { ten_dang_nhap, mat_khau } = req.body;

    if (!ten_dang_nhap || !mat_khau) {
      return sendError(res, 400, 'Tên đăng nhập và mật khẩu là bắt buộc');
    }

    const [rows] = await pool.query(
      `SELECT ma_tai_khoan, ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai FROM tai_khoan WHERE ten_dang_nhap = ?`,
      [ten_dang_nhap],
    );

    const result = rows as Array<any>;
    if (!result.length) {
      return sendError(res, 401, 'Tên đăng nhập không đúng');
    }

    const user = result[0];
    const isValidPassword = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!isValidPassword) {
      return sendError(res, 401, 'Mật khẩu không đúng');
    }

    if (user.trang_thai !== 'HoatDong') {
      return sendError(res, 403, 'Tài khoản đang bị khóa');
    }

    const token = signToken({
      ma_tai_khoan: user.ma_tai_khoan,
      ten_dang_nhap: user.ten_dang_nhap,
      vai_tro: user.vai_tro,
    });

    const safeUser = {
      ma_tai_khoan: user.ma_tai_khoan,
      ten_dang_nhap: user.ten_dang_nhap,
      ho_ten: user.ho_ten,
      email: user.email,
      so_dien_thoai: user.so_dien_thoai,
      dia_chi: user.dia_chi,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
    };

    return sendSuccess(res, 'Đăng nhập thành công', { token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    if ((error as { code?: string }).code === 'ER_ACCESS_DENIED_ERROR') {
      return sendError(res, 503, 'Backend chưa kết nối được MySQL. Kiểm tra DB_USER và DB_PASSWORD trong file .env');
    }
    return sendError(res, 500, 'Lỗi khi đăng nhập', [(error as Error).message]);
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Bạn chưa đăng nhập');
    }

    const [rows] = await pool.query(
      `SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai, dia_chi, vai_tro, trang_thai, ngay_tao FROM tai_khoan WHERE ma_tai_khoan = ?`,
      [req.user.ma_tai_khoan],
    );

    const user = (rows as any[])[0];
    if (!user) {
      return sendError(res, 404, 'Không tìm thấy người dùng');
    }

    return sendSuccess(res, 'Lấy thông tin người dùng thành công', user);
  } catch (error) {
    console.error('Me error:', error);
    return sendError(res, 500, 'Lỗi khi lấy thông tin người dùng', [(error as Error).message]);
  }
}
