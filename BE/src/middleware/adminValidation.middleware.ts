import { NextFunction, Request, Response } from 'express';

// Returns field names shared with the admin forms. Existing clients can still use message.
export function adminValidation(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT'].includes(req.method)) return next();
  const resource = req.path.split('/')[1];
  const required: Record<string, string[]> = {
    'san-pham': ['ma_san_pham_code', 'ten_san_pham', 'ma_danh_muc', 'ma_thuong_hieu', 'gia_ban'],
    'danh-muc': ['ten_danh_muc'], 'thuong-hieu': ['ten_thuong_hieu'], 'nhan-vien': ['ho_ten'], 'tai-khoan': ['ho_ten', 'email'],
  };
  if (!required[resource]) return next();
  const errors: Record<string, string> = {};
  for (const field of required[resource]) {
    const value = req.body[field];
    if ((req.method === 'POST' || value !== undefined) && (value == null || String(value).trim() === '')) errors[field] = 'Thông tin này là bắt buộc';
  }
  for (const field of ['gia_nhap', 'gia_ban', 'so_luong', 'bao_hanh', 'luong', 'ma_danh_muc', 'ma_thuong_hieu']) {
    const value = req.body[field];
    if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < (['gia_ban', 'ma_danh_muc', 'ma_thuong_hieu'].includes(field) ? 1 : 0))) errors[field] = 'Giá trị số không hợp lệ';
    if (value !== undefined && ['so_luong', 'bao_hanh', 'ma_danh_muc', 'ma_thuong_hieu'].includes(field) && !Number.isInteger(Number(value))) errors[field] = 'Vui lòng nhập số nguyên';
  }
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) errors.email = 'Email không hợp lệ';
  if (req.body.ngay_vao_lam && (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.ngay_vao_lam) || Number.isNaN(Date.parse(req.body.ngay_vao_lam)))) errors.ngay_vao_lam = 'Ngày không hợp lệ';
  const states: Record<string, string[]> = { 'san-pham': ['DangBan', 'HetHang', 'NgungBan'], 'nhan-vien': ['DangLam', 'NghiLam'], 'tai-khoan': ['HoatDong', 'Khoa'] };
  if (req.body.trang_thai !== undefined && states[resource] && !states[resource].includes(req.body.trang_thai)) errors.trang_thai = 'Trạng thái không hợp lệ';
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Vui lòng kiểm tra thông tin đã nhập', fieldErrors: errors });
  next();
}
