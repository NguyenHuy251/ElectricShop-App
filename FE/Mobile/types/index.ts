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

export interface Contact {
  ma_lien_he: number;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string | null;
  tieu_de: string;
  noi_dung: string;
  phan_hoi?: string | null;
  ngay_phan_hoi?: string | null;
  ngay_gui?: string;
  trang_thai: 'ChoPhanHoi' | 'DaPhanHoi';
}

export interface ProductSpecification {
  ma_thong_so: number;
  ten_thong_so?: string;
  ten_nhom?: string;
  kieu_du_lieu?: string;
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
  type?: string;
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
  trang_thai?: 'DangBan' | 'HetHang' | 'NgungBan';
  bao_hanh?: number | null;
  thong_so_ky_thuat?: ProductSpecification[];
  danh_sach_hinh_anh?: ProductImage[];
  specifications?: GroupedSpecification[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  category_specifications?: CategorySpecification[];
}

export interface CategorySpecification {
  ma_thong_so: number;
  ten_thong_so: string;
  kieu_du_lieu?: string;
  don_vi?: string | null;
  cho_phep_loc?: boolean;
}

export interface ProductVariant {
  ma_bien_the: number;
  ma_san_pham: number;
  ma_sku: string;
  ten_bien_the: string;
  gia_ban: number | string;
  so_luong: number;
  trang_thai: 'DangBan' | 'HetHang' | 'NgungBan';
  thong_so_ky_thuat?: ProductSpecification[];
}

export interface ProductReview {
  ma_danh_gia: number;
  ma_san_pham: number;
  ho_ten: string;
  so_sao: number;
  noi_dung?: string | null;
  ngay_danh_gia?: string;
}

export interface CheckoutSelection {
  ma_code?: string;
  ma_bien_the?: number;
  source?: 'buy_now';
  ma_san_pham?: number;
  so_luong?: number;
}

export interface CartItem {
  ma_bien_the?: number | null;
  ten_bien_the?: string | null;
  ma_san_pham: number;
  so_luong: number;
  ten_san_pham?: string;
  gia_ban?: number;
  hinh_anh?: string | null;
  ton_kho?: number;
  trang_thai?: string;
}

export interface CheckoutQuote extends CheckoutSelection {
  giam_gia?: number;
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
  reviews?: ProductReview[];
  can_review?: boolean;
}
