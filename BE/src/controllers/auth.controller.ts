import bcrypt from 'bcryptjs';
import { isMobileRequest, mobileStaffMessage, rejectMobileStaff } from '../utils/mobile-access.js';
import { loadPermissions } from '../services/permission.service.js';
import { Request, Response } from 'express';
import { issueSession,refreshSession,revokeSession } from '../services/session.service.js';
import { CheckoutError } from '../utils/checkout.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth.service.js';
import { grantVoucherToUser } from '../services/voucher.service.js';
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
  try{return sendSuccess(res,'Đã gia hạn phiên',await refreshSession(req.body?.refresh_token,isMobileRequest(req)));}
  catch(error){if(error instanceof CheckoutError && error.message===mobileStaffMessage)return rejectMobileStaff(res);return sendError(res,error instanceof CheckoutError ? error.status : 503,error instanceof CheckoutError ? error.message : 'Chưa thể gia hạn phiên.');}
}
export async function logout(req:Request,res:Response){
  try{await revokeSession(req.body?.refresh_token);return sendSuccess(res,'Đã đăng xuất',null);}
  catch{return sendError(res,503,'Chưa thể đăng xuất khỏi máy chủ.');}
}

export async function register(req: Request, res: Response) {
  try {
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, dia_chi } = req.body;
    const rawMaMoi = typeof req.body?.ma_moi === 'string' ? req.body.ma_moi.trim().toUpperCase() : '';

    if (!ten_dang_nhap || !mat_khau || !ho_ten || !email) {
      return sendError(res, 400, 'Thiếu thông tin bắt buộc');
    }
    if (typeof ten_dang_nhap!=='string' || !/^[A-Za-z0-9_.-]{3,50}$/.test(ten_dang_nhap) || typeof mat_khau!=='string' || mat_khau.length<8 || Buffer.byteLength(mat_khau,'utf8')>72 || typeof ho_ten!=='string' || ho_ten.trim().length<2 || ho_ten.length>100 || typeof email!=='string' || email.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (so_dien_thoai && (typeof so_dien_thoai!=='string' || !/^0[35789]\d{8}$/.test(so_dien_thoai))) || (dia_chi && (typeof dia_chi!=='string' || dia_chi.length>255))) return sendError(res,400,'Tên đăng nhập, mật khẩu (8–72 byte), họ tên, email hoặc điện thoại không hợp lệ.');

    // Kiểm tra trùng từng trường: tên đăng nhập, email, số điện thoại (báo lỗi ngay ở dòng tương ứng)
    const [dupRows] = await pool.query(
      'SELECT ten_dang_nhap, email, so_dien_thoai FROM tai_khoan WHERE ten_dang_nhap = ? OR (email IS NOT NULL AND email = ?) OR (so_dien_thoai IS NOT NULL AND so_dien_thoai = ?)',
      [ten_dang_nhap, email, so_dien_thoai || '']
    );
    const duplicateFields: Record<string, string> = {};
    for (const row of dupRows as any[]) {
      if (row.ten_dang_nhap === ten_dang_nhap) duplicateFields.ten_dang_nhap = 'Tên đăng nhập đã được sử dụng.';
      if (row.email === email) duplicateFields.email = 'Email đã được sử dụng.';
      if (so_dien_thoai && row.so_dien_thoai === so_dien_thoai) duplicateFields.so_dien_thoai = 'Số điện thoại đã được sử dụng.';
    }
    if (Object.keys(duplicateFields).length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập, email hoặc số điện thoại đã tồn tại trên hệ thống.',
        fieldErrors: duplicateFields,
      });
    }

    // Mã mời (không bắt buộc): phải khớp ma_gioi_thieu của một tài khoản đã có
    let inviter: { ma_tai_khoan: number; ho_ten: string } | null = null;
    if (rawMaMoi) {
      if (!/^[A-Z0-9]{3,30}$/.test(rawMaMoi)) {
        return res.status(400).json({ success: false, message: 'Mã mời không hợp lệ.', fieldErrors: { ma_moi: 'Mã mời gồm 3–30 chữ cái hoặc số, không dấu.' } });
      }
      const [inviterRows] = await pool.query('SELECT ma_tai_khoan, ho_ten FROM tai_khoan WHERE ma_gioi_thieu = ?', [rawMaMoi]);
      if (!(inviterRows as any[]).length) {
        return res.status(400).json({ success: false, message: 'Mã mời không tồn tại hoặc không hợp lệ.', fieldErrors: { ma_moi: 'Mã mời không tồn tại hoặc không hợp lệ.' } });
      }
      inviter = (inviterRows as any[])[0];
    }

    const hashedPassword = await bcrypt.hash(mat_khau, 10);
    const result = await authService.register([ten_dang_nhap, hashedPassword, ho_ten, email, so_dien_thoai || null, dia_chi || null]);

    const insertResult = result[0] as { insertId: number };
    const newAccountId = insertResult.insertId;

    // Sinh mã giới thiệu cho tài khoản mới (trước đây chỉ có migration backfill nên tài khoản mới mãi hiển thị "Đang cập nhật")
    let maGioiThieu: string | null = null;
    for (let attempt = 0; attempt < 5 && !maGioiThieu; attempt++) {
      try {
        const candidate = `ESHOP${newAccountId}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        await pool.execute('UPDATE tai_khoan SET ma_gioi_thieu = ? WHERE ma_tai_khoan = ?', [candidate, newAccountId]);
        maGioiThieu = candidate;
      } catch {
        // trùng mã (UNIQUE), thử lại với mã khác
      }
    }

    const user = {
      ma_tai_khoan: newAccountId,
      ten_dang_nhap,
      ho_ten,
      email,
      so_dien_thoai: so_dien_thoai || null,
      dia_chi: dia_chi || null,
      vai_tro: 'KhachHang',
      trang_thai: 'HoatDong',
      ...(maGioiThieu ? { ma_gioi_thieu: maGioiThieu } : {}),
    };

    // Áp dụng mã mời sau khi tạo tài khoản: cả hai bên +500 Xu và đều nhận voucher SHAREAPP50
    if (inviter) {
      try {
        await pool.execute('UPDATE tai_khoan SET ma_nguoi_gioi_thieu = ?, diem_thuong = diem_thuong + 500 WHERE ma_tai_khoan = ?', [inviter.ma_tai_khoan, newAccountId]);
        await pool.execute('UPDATE tai_khoan SET diem_thuong = diem_thuong + 500 WHERE ma_tai_khoan = ?', [inviter.ma_tai_khoan]);
        await pool.execute('INSERT INTO lich_su_gioi_thieu (ma_nguoi_moi, ma_nguoi_duoc_moi, diem_thuong) VALUES (?, ?, 500)', [inviter.ma_tai_khoan, newAccountId]);
        await grantVoucherToUser(pool, newAccountId, 'SHAREAPP50', 'TanThuGioiThieu', 30);
        await grantVoucherToUser(pool, inviter.ma_tai_khoan, 'SHAREAPP50', 'NguoiMoiGioiThieu', 30);
      } catch (referralError) {
        console.error('Apply invite code error:', referralError);
      }
    }

    return sendSuccess(res, inviter ? `Đăng ký thành công! Bạn đã được kết nối với ${inviter.ho_ten}. Cả hai cùng nhận +500 Xu và Voucher SHAREAPP50.` : 'Đăng ký thành công', { user, da_ap_dung_ma_moi: Boolean(inviter) });
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

    if (isMobileRequest(req) && user.vai_tro === 'NhanVien') return rejectMobileStaff(res);
    const session = await issueSession(user.ma_tai_khoan,user.mat_khau,undefined,isMobileRequest(req));

    const safeUser = {
      ma_tai_khoan: user.ma_tai_khoan,
      ten_dang_nhap: user.ten_dang_nhap,
      ho_ten: user.ho_ten,
      email: user.email,
      so_dien_thoai: user.so_dien_thoai,
      dia_chi: user.dia_chi,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
      permissions: await loadPermissions(user.ma_tai_khoan, user.vai_tro),
    };

    return sendSuccess(res, 'Đăng nhập thành công', { ...session, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    if(error instanceof CheckoutError && error.message===mobileStaffMessage)return rejectMobileStaff(res);
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

    return sendSuccess(res, 'Lấy thông tin người dùng thành công', { ...user, permissions: req.user.permissions || [] });
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
