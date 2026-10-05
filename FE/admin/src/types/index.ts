export interface User {
  ma_tai_khoan: number;
  ten_dang_nhap: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  vai_tro: 'Admin' | 'NhanVien' | 'KhachHang';
  trang_thai: 'HoatDong' | 'Khoa';
  ngay_tao?: string;
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

export type SpecDataType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'OPTION';

export interface SpecificationGroup {
  ma_nhom_thong_so: number;
  ten_nhom_thong_so: string;
  thu_tu_hien_thi?: number;
  trang_thai?: boolean;
}

export interface Specification {
  ma_thong_so: number;
  ma_nhom_thong_so: number;
  ten_thong_so: string;
  kieu_du_lieu: SpecDataType;
  don_vi?: string | null;
  cho_phep_loc?: boolean;
  thu_tu_hien_thi?: number;
  trang_thai?: boolean;
  ten_nhom_thong_so?: string;
}

export interface CategorySpecification {
  ma_danh_muc: number;
  ma_thong_so: number;
  ma_nhom_thong_so?: number;
  ten_nhom_thong_so?: string;
  ten_thong_so: string;
  kieu_du_lieu: SpecDataType;
  don_vi?: string | null;
  cho_phep_loc?: boolean;
  bat_buoc?: boolean;
  thu_tu_hien_thi?: number;
}

export interface ProductSpecification {
  ma_san_pham?: number;
  ma_thong_so: number;
  ten_thong_so?: string;
  ten_nhom?: string;
  kieu_du_lieu?: SpecDataType;
  don_vi?: string | null;
  gia_tri?: string | null;
  gia_tri_so?: number | null;
  gia_tri_bool?: boolean | null;
  thu_tu_nhom?: number;
  thu_tu_thong_so?: number;
}

export interface ProductImage {
  ma_hinh_anh?: number;
  ma_san_pham?: number;
  duong_dan: string;
  mo_ta?: string | null;
  la_anh_chinh?: boolean;
  thu_tu_hien_thi?: number;
}

export interface GroupedSpecificationItem {
  ma_thong_so: number;
  name: string;
  value: string;
  numeric_value?: number | null;
  bool_value?: boolean | null;
  unit?: string | null;
  type?: SpecDataType;
  order?: number;
}

export interface GroupedSpecification {
  group: string;
  items: GroupedSpecificationItem[];
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
  trang_thai: 'DangBan' | 'HetHang' | 'NgungBan';
  ngay_tao?: string;
  ten_danh_muc?: string;
  ten_thuong_hieu?: string;
  thong_so_ky_thuat?: ProductSpecification[];
  danh_sach_hinh_anh?: ProductImage[];
  specifications?: GroupedSpecification[];
  images?: ProductImage[];
}

export interface ProductInput {
  ma_san_pham_code: string;
  ten_san_pham: string;
  ma_danh_muc: number;
  ma_thuong_hieu: number;
  gia_nhap?: number;
  gia_ban: number;
  so_luong: number;
  bao_hanh?: number;
  hinh_anh?: string | null;
  trang_thai: 'DangBan' | 'HetHang' | 'NgungBan';
  mo_ta?: string | null;
  thong_so?: { ma_thong_so: number; gia_tri?: string | null; gia_tri_so?: number | null; gia_tri_bool?: boolean | null }[];
  danh_sach_hinh_anh?: { duong_dan: string; mo_ta?: string | null; la_anh_chinh?: boolean; thu_tu_hien_thi?: number }[];
}

export interface Order {
  ma_giam_gia?: string;
  tien_giam?: number;
  tam_tinh?: number;
  ten_dang_nhap?: string;
  ho_ten?: string;
  ma_don_hang: number;
  ma_tai_khoan: number;
  ho_ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  tong_tien: number | string;
  phuong_thuc_thanh_toan: 'TienMat' | 'ChuyenKhoan' | 'ThanhToanKhiNhanHang';
  trang_thai: 'ChoXacNhan' | 'DaXacNhan' | 'DangGiao' | 'DaGiao' | 'DaHuy';
  ghi_chu?: string | null;
  ngay_dat?: string;
  items?: Array<{ ma_don_hang: number; ma_san_pham: number; ten_san_pham: string; so_luong: number; don_gia: number | string; thanh_tien: number | string }>;
}

export interface DashboardStatistics {
  so_don_da_xac_nhan: number;
  doanh_thu_theo_thang: { thang: string; doanh_thu: number | string }[];
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

export interface Employee {
  ma_nhan_vien: number; ma_tai_khoan?: number | null; ho_ten: string; chuc_vu?: string;
  so_dien_thoai?: string; email?: string; ngay_vao_lam?: string; luong: number | string; trang_thai: 'DangLam' | 'NghiLam';
}
export interface Review {
  ma_danh_gia: number; ma_san_pham: number; ho_ten: string; ten_san_pham: string; so_sao: number; noi_dung?: string; ngay_danh_gia: string;
}
export interface Contact {
  ma_lien_he: number; ho_ten: string; email: string; so_dien_thoai?: string; tieu_de: string; noi_dung: string;
  phan_hoi?: string | null; ngay_phan_hoi?: string | null; ngay_gui: string; trang_thai: 'ChoPhanHoi' | 'DaPhanHoi';
}
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface ApiResponse<T> { success: boolean; message: string; data: T; pagination?: Pagination }
export interface ApiError { message?: string; errors?: string[]; fieldErrors?: Record<string, string | string[]> }
