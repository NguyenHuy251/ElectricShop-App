export interface User {
  ma_tai_khoan: number;
  ten_dang_nhap: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  vai_tro: 'Admin' | 'NhanVien' | 'KhachHang';
  trang_thai: 'HoatDong' | 'Khoa';
}

export interface ProductSpecification {
  ma_thong_so: number;
  ten_thong_so?: string;
  ten_nhom?: string;
  don_vi?: string | null;
  gia_tri?: string | null;
  gia_tri_so?: number | null;
  gia_tri_bool?: boolean | null;
}

export interface ProductImage {
  ma_hinh_anh?: number;
  duong_dan: string;
  mo_ta?: string | null;
  la_anh_chinh?: boolean;
  thu_tu_hien_thi?: number;
}

export interface GroupedSpecificationItem {
  ma_thong_so: number;
  name: string;
  value: string;
  unit?: string | null;
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
  gia_ban: number;
  so_luong: number;
  hinh_anh?: string | null;
  ten_danh_muc?: string;
  ten_thuong_hieu?: string;
  thong_so_ky_thuat?: ProductSpecification[];
  danh_sach_hinh_anh?: ProductImage[];
  specifications?: GroupedSpecification[];
  images?: ProductImage[];
}

export interface CartItem {
  ma_san_pham: number;
  so_luong: number;
  ten_san_pham?: string;
  gia_ban?: number;
  hinh_anh?: string | null;
}

export interface Order {
  ma_don_hang: number;
  ma_tai_khoan: number;
  ho_ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  tong_tien: number;
  phuong_thuc_thanh_toan: 'TienMat' | 'ChuyenKhoan' | 'ThanhToanKhiNhanHang';
  trang_thai: 'ChoXacNhan' | 'DaXacNhan' | 'DangGiao' | 'DaGiao' | 'DaHuy';
  ghi_chu?: string | null;
  ngay_dat?: string;
  items?: any[];
}
