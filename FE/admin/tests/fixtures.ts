import type { Page } from '@playwright/test';
export async function mockApi(page: Page, role = 'Admin', authenticated = true) {
  const user = { ma_tai_khoan: 1, ho_ten: 'Quản trị', ten_dang_nhap: 'admin-test', email: 'admin@example.test', vai_tro: role, trang_thai: 'HoatDong' };
  const data: Record<string, Record<string, unknown>[]> = {
    'danh-muc': [{ ma_danh_muc: 8, ten_danh_muc: 'Gia dụng', trang_thai: 1, mo_ta: 'Nhà bếp' }],
    'thuong-hieu': [{ ma_thuong_hieu: 9, ten_thuong_hieu: 'Thương hiệu mẫu', quoc_gia: 'Việt Nam', mo_ta: 'Mô tả thương hiệu' }],
    'san-pham': [{ ma_san_pham: 7, ma_san_pham_code: 'SP-7', ten_san_pham: 'Nồi cơm điện', ma_danh_muc: 8, ma_thuong_hieu: 9, gia_ban: 1000000, gia_nhap: 800000, so_luong: 10, bao_hanh: 12, trang_thai: 'DangBan', chi_tiet_san_pham: { cong_suat: '700W' } }],
    'tai-khoan': [user, { ma_tai_khoan: 2, ho_ten: 'Khách mẫu', ten_dang_nhap: 'customer', email: 'customer@example.test', so_dien_thoai: '0901234567', vai_tro: 'KhachHang', trang_thai: 'HoatDong' }, { ma_tai_khoan: 3, ho_ten: 'Nhân viên mẫu', ten_dang_nhap: 'staff', email: 'staff@example.test', vai_tro: 'NhanVien', trang_thai: 'HoatDong' }],
    'nhan-vien': [{ ma_nhan_vien: 1, ma_tai_khoan: 3, ho_ten: 'Nhân viên mẫu', chuc_vu: 'Bán hàng', ngay_vao_lam: '2026-01-01', luong: 8000000, trang_thai: 'DangLam' }],
    'don-hang': [{ ma_don_hang: 10, ma_tai_khoan: 2, ten_dang_nhap: 'customer', ho_ten_nguoi_nhan: 'Người nhận mẫu', so_dien_thoai: '0901234567', dia_chi_giao_hang: 'Hà Nội', tong_tien: 1000000, trang_thai: 'ChoXacNhan', ngay_dat: '2026-09-01', phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang', items: [{ ma_san_pham: 7, ten_san_pham: 'Nồi cơm điện', so_luong: 1, don_gia: 1000000, thanh_tien: 1000000 }] }],
    'danh-gia': [{ ma_danh_gia: 4, ma_san_pham: 7, ho_ten: 'Khách mẫu', ten_san_pham: 'Nồi cơm điện', so_sao: 5, noi_dung: 'Sản phẩm tốt', ngay_danh_gia: '2026-09-01' }],
    'lien-he': [{ ma_lien_he: 6, ho_ten: 'Khách mẫu', email: 'customer@example.test', tieu_de: 'Hỏi bảo hành', noi_dung: 'Nội dung liên hệ đầy đủ', trang_thai: 'ChuaXuLy', ngay_gui: '2026-09-01' }],
  };
  const keys: Record<string, string> = { 'danh-muc': 'ma_danh_muc', 'thuong-hieu': 'ma_thuong_hieu', 'san-pham': 'ma_san_pham', 'tai-khoan': 'ma_tai_khoan', 'nhan-vien': 'ma_nhan_vien', 'don-hang': 'ma_don_hang', 'danh-gia': 'ma_danh_gia', 'lien-he': 'ma_lien_he' };
  const requests: { resource: string; method: string; body: Record<string, unknown>; search: string }[] = [];
  let expired = false;
  await page.addInitScript((hasToken: boolean) => { if (hasToken) localStorage.setItem('admin_token', 'mock-token'); }, authenticated);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith('/api/')) return route.fallback();
    const [resource, id] = url.pathname.replace('/api/', '').split('/');
    const method = route.request().method(); const body = route.request().postDataJSON() || {};
    requests.push({ resource, method, body, search: url.search });
    const reply = (value: unknown, pagination?: unknown) => route.fulfill({ json: { success: true, data: value, pagination } });
    if (expired) return route.fulfill({ status: 401, json: { message: 'Phiên đăng nhập đã hết hạn' } });
    if (resource === 'auth') return reply(id === 'login' ? { token: 'mock-token', user } : user);
    if (resource === 'dashboard') return reply({ tong_san_pham: 1, tong_khach_hang: 1, tong_nhan_vien: 1, tong_don_hang: 1, tong_doanh_thu: 1000000, so_don_cho_xac_nhan: 1, so_don_da_xac_nhan: 0, so_don_dang_giao: 0, so_don_da_giao: 0, so_don_da_huy: 0, doanh_thu_theo_thang: [{ thang: '2026-09', doanh_thu: 1000000 }] });
    const rows = data[resource] || []; const key = keys[resource]; const row = rows.find(row => Number(row[key]) === Number(id));
    if (method === 'POST') { const created = { ...body, [key]: 99 }; rows.unshift(created); return reply(created); }
    if (method === 'PUT') { Object.assign(row || {}, body); return reply(row); }
    if (method === 'DELETE') { data[resource] = rows.filter(row => Number(row[key]) !== Number(id)); return reply({}); }
    if (id) return reply(row);
    let filtered = rows;
    if (resource === 'san-pham' && url.searchParams.get('search')) filtered = rows.filter(row => String(row.ten_san_pham).includes(url.searchParams.get('search')!));
    if (resource === 'danh-gia') filtered = rows.filter(row => (!url.searchParams.get('so_sao') || Number(row.so_sao) === Number(url.searchParams.get('so_sao'))) && (!url.searchParams.get('ma_san_pham') || Number(row.ma_san_pham) === Number(url.searchParams.get('ma_san_pham'))));
    return reply(filtered, { page: 1, limit: 10, total: filtered.length, totalPages: 1 });
  });
  return { requests, data, expire: () => { expired = true; } };
}
