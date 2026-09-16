export type UserRole = 'Admin' | 'NhanVien' | 'KhachHang';
export type UserStatus = 'HoatDong' | 'Khoa';
export type EmployeeStatus = 'DangLam' | 'NghiLam';
export type ProductStatus = 'DangBan' | 'HetHang' | 'NgungBan';
export type OrderStatus = 'ChoXacNhan' | 'DaXacNhan' | 'DangGiao' | 'DaGiao' | 'DaHuy';
export type PaymentMethod = 'TienMat' | 'ChuyenKhoan' | 'ThanhToanKhiNhanHang';
export type ContactStatus = 'ChuaXuLy' | 'DangXuLy' | 'DaXuLy';

export interface User {
  ma_tai_khoan: number;
  ten_dang_nhap: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  vai_tro: UserRole;
  trang_thai: UserStatus;
  ngay_tao?: string;
}

export interface Employee {
  ma_nhan_vien: number;
  ma_tai_khoan?: number | null;
  ho_ten: string;
  chuc_vu?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  ngay_vao_lam?: string | null;
  luong?: number | string | null;
  trang_thai?: EmployeeStatus | null;
}

export interface Category {
  ma_danh_muc: number;
  ten_danh_muc: string;
  mo_ta?: string | null;
  trang_thai?: boolean;
}

export interface Brand {
  ma_thuong_hieu: number;
  ten_thuong_hieu: string;
  quoc_gia?: string | null;
  mo_ta?: string | null;
}

export interface ProductDetail {
  ma_chi_tiet: number;
  ma_san_pham: number;
  cong_suat?: string | null;
  dung_tich?: string | null;
  kich_thuoc?: string | null;
  mau_sac?: string | null;
  xuat_xu?: string | null;
  thong_so_khac?: string | null;
}

export interface Product {
  ma_san_pham: number;
  ma_danh_muc: number;
  ma_thuong_hieu: number;
  ma_san_pham_code: string;
  ten_san_pham: string;
  mo_ta?: string | null;
  gia_nhap?: number | string;
  gia_ban: number | string;
  so_luong: number;
  bao_hanh?: number;
  hinh_anh?: string | null;
  trang_thai: ProductStatus;
  ngay_tao?: string;
  ten_danh_muc?: string;
  ten_thuong_hieu?: string;
  chi_tiet_san_pham?: ProductDetail;
}

export interface CartItem {
  ma_gio_hang: number;
  ma_san_pham: number;
  so_luong: number;
  ten_san_pham?: string;
  gia_ban?: number | string;
  hinh_anh?: string | null;
}

export interface Cart {
  ma_gio_hang: number;
  ma_tai_khoan: number;
  ngay_tao?: string;
  items?: CartItem[];
}

export interface OrderItem {
  ma_don_hang: number;
  ma_san_pham: number;
  ten_san_pham: string;
  so_luong: number;
  don_gia: number | string;
  thanh_tien?: number | string;
}

export interface Order {
  ma_don_hang: number;
  ma_tai_khoan: number;
  ho_ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  tong_tien: number | string;
  phuong_thuc_thanh_toan: PaymentMethod;
  trang_thai: OrderStatus;
  ghi_chu?: string | null;
  ngay_dat?: string;
  items?: OrderItem[];
  ten_nguoi_dat?: string;
}

export interface Review {
  ma_danh_gia: number;
  ma_san_pham: number;
  ma_tai_khoan: number;
  so_sao: number;
  noi_dung?: string | null;
  ngay_danh_gia?: string;
  ho_ten?: string;
  ten_san_pham?: string;
}

export interface Contact {
  ma_lien_he: number;
  ma_tai_khoan?: number | null;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  tieu_de: string;
  noi_dung: string;
  trang_thai: ContactStatus;
  ngay_gui?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  pagination?: PaginationMeta;
}

export interface DashboardStatistics {
  tong_san_pham: number;
  tong_khach_hang: number;
  tong_nhan_vien: number;
  tong_don_hang: number;
  tong_doanh_thu: number;
  so_don_cho_xac_nhan: number;
  so_don_dang_giao: number;
  so_don_da_giao: number;
  so_don_da_huy: number;
}
