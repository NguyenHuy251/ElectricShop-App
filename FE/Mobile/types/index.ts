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
  trang_thai?: 'DangBan' | 'HetHang' | 'NgungBan';
  bao_hanh?: number | null;
  chi_tiet_san_pham?: {
    cong_suat?: string | null;
    dung_tich?: string | null;
    kich_thuoc?: string | null;
    mau_sac?: string | null;
    xuat_xu?: string | null;
    thong_so_khac?: string | null;
  } | null;
}

export interface ProductReview {
  ma_danh_gia: number;
  ho_ten: string;
  so_sao: number;
  noi_dung?: string | null;
  ngay_danh_gia?: string;
}

export interface CheckoutSelection {
  source?: 'buy_now';
  ma_san_pham?: number;
  so_luong?: number;
}

export interface CartItem {
  ma_san_pham: number;
  so_luong: number;
  ten_san_pham?: string;
  gia_ban?: number;
  hinh_anh?: string | null;
  ton_kho?: number;
  trang_thai?: string;
}

export interface CheckoutQuote extends CheckoutSelection {
  items: CartItem[];
  tam_tinh: number;
  phi_giao_hang: number;
  tong_tien: number;
  snapshot: string;
  issues: string[];
  can_checkout: boolean;
}

export interface CheckoutPayload extends CheckoutSelection {
  ho_ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_giao_hang: string;
  ghi_chu: string;
  phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang';
  snapshot: string;
  request_id: string;
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
