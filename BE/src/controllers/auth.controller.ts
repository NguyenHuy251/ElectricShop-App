import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { issueSession,refreshSession,revokeSession } from '../services/session.service.js';
import { CheckoutError } from '../utils/checkout.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth.service.js';
import { pool } from '../config/database.js';

export async function changePassword(req: AuthRequest, res: Response) {
  if (!req.user) return sendError(res, 401, 'Bạn chưa đăng nhập');
  const { mat_khau_cu, mat_khau_moi } = req.body || {};
  if (typeof mat_khau_cu !== 'string' || typeof mat_khau_moi !== 'string' || mat_khau_moi.length < 8 || Buffer.byteLength(mat_khau_moi,'utf8') > 72 || mat_khau_cu === mat_khau_moi) return sendError(res, 400, 'Mật khẩu mới phải khác mật khẩu cũ và có 8–72 ký tự.');
  try {
    const [rows] = await pool.query('SELECT mat_khau FROM tai_khoan WHERE ma_tai_khoan = ?', [req.user.ma_tai_khoan]);
    const current = (rows as { mat_khau: string }[])[0];
    if (!current || !await bcrypt.compare(mat_khau_cu, current.mat_khau)) return sendError(res, 400, 'Mật khẩu hiện tại không đúng.');
    const hash = await bcrypt.hash(mat_khau_moi, 12);
    const [result] = await pool.execute('UPDATE tai_khoan SET mat_khau = ?, token_version=token_version+1 WHERE ma_tai_khoan = ? AND mat_khau = ?', [hash, req.user.ma_tai_khoan, current.mat_khau]);
    if (!(result as { affectedRows: number }).affectedRows) return sendError(res, 409, 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.');
    return sendSuccess(res, 'Đổi mật khẩu thành công', null);
  } catch { return sendError(res, 503, 'Chưa thể đổi mật khẩu. Vui lòng thử lại.'); }
}

export async function refresh(req:Request,res:Response){
  try{return sendSuccess(res,'Đã gia hạn phiên',await refreshSession(req.body?.refresh_token));}
  catch(error){return sendError(res,error instanceof CheckoutError ? error.status : 503,error instanceof CheckoutError ? error.message : 'Chưa thể gia hạn phiên.');}
}
export async function logout(req:Request,res:Response){
  try{await revokeSession(req.body?.refresh_token);return sendSuccess(res,'Đã đăng xuất',null);}
  catch{return sendError(res,503,'Chưa thể đăng xuất khỏi máy chủ.');}
}

export async function register(req: Request, res: Response) {
  try {
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi } = req.body;

    if (!ten_dang_nhap || !mat_khau || !ho_ten || !email) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }
    if (typeof ten_dang_nhap!=='string' || !/^[A-Za-z0-9_.-]{3,50}$/.test(ten_dang_nhap) || typeof mat_khau!=='string' || mat_khau.length<8 || Buffer.byteLength(mat_khau,'utf8')>72 || typeof ho_ten!=='string' || ho_ten.trim().length<2 || ho_ten.length>100 || typeof email!=='string' || email.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (so_dien_thoai && (typeof so_dien_thoai!=='string' || !/^0[35789]\d{8}$/.test(so_dien_thoai))) || (dia_chi && (typeof dia_chi!=='string' || dia_chi.length>255))) return sendError(res,400,'Tên đăng nhập, mật khẩu (8–72 byte), họ tên, email hoặc điện thoại không hợp lệ.');

    const rows = await authService.checkDuplicate(ten_dang_nhap, email);
    if (rows.length > 0) {
      return sendError(res, 409, 'Tên đăng nhập hoặc email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(mat_khau, 10);
    const result = await authService.register([ten_dang_nhap, hashedPassword, ho_ten, email, so_dien_thoai || null, dia_chi || null]);

    const insertResult = result[0] as { insertId: number };
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

    const session = await issueSession(user.ma_tai_khoan,hashedPassword);

    return sendSuccess(res, 'Đăng ký thành công', { ...session, user });
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
    if (typeof ten_dang_nhap!=='string' || typeof mat_khau!=='string' || ten_dang_nhap.length>50 || mat_khau.length>72) return sendError(res,400,'Thông tin đăng nhập không hợp lệ.');

    const rows = await authService.findByUsername(ten_dang_nhap);

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

    const session = await issueSession(user.ma_tai_khoan,user.mat_khau);

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

    return sendSuccess(res, 'Đăng nhập thành công', { ...session, user: safeUser });
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

    const rows = await authService.findById(req.user.ma_tai_khoan);

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

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Bạn chưa đăng nhập');
    }

    const { ho_ten, email, so_dien_thoai, dia_chi } = req.body;
    if (!ho_ten?.trim() || !email?.trim()) {
      return sendError(res, 400, 'Họ tên và email là bắt buộc');
    }

    const existingRows = await authService.checkDuplicate('', email.trim(), req.user.ma_tai_khoan);
    if (existingRows.length > 0) {
      return sendError(res, 409, 'Email đã được sử dụng bởi tài khoản khác');
    }

    await authService.updateProfile([req.user.ma_tai_khoan, ho_ten.trim(), email.trim(), so_dien_thoai?.trim() || null, dia_chi?.trim() || null]);

    const rows = await authService.findById(req.user.ma_tai_khoan);

    return sendSuccess(res, 'Cập nhật thông tin tài khoản thành công', (rows as any[])[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, 'Lỗi khi cập nhật thông tin tài khoản', [(error as Error).message]);
  }
}
