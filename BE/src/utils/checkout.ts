import { createHash } from 'node:crypto';

export class CheckoutError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: Record<string, string>) { super(message); }
}

export function checkoutSelection(value: Record<string, unknown>, query = false): { source?: 'buy_now'; ma_san_pham?: number; ma_bien_the?: number; so_luong?: number } {
  if (value.source === undefined || value.source === 'cart') {
    if (value.ma_san_pham !== undefined || value.so_luong !== undefined || value.ma_bien_the !== undefined) throw new CheckoutError(400, 'Nguồn thanh toán không hợp lệ.');
    return {};
  }
  if (value.source !== 'buy_now') throw new CheckoutError(400, 'Nguồn thanh toán không hợp lệ.');
  const integer = (v: unknown) => typeof v === 'number' ? v : query && typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : NaN;
  const productId = integer(value.ma_san_pham), quantity = integer(value.so_luong);
  if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) throw new CheckoutError(400, 'Chọn sản phẩm và số lượng nguyên từ 1 đến 999.');
  const variantId = value.ma_bien_the == null ? undefined : integer(value.ma_bien_the);
  if (variantId !== undefined && (!Number.isSafeInteger(variantId) || variantId < 1)) throw new CheckoutError(400, 'Biến thể không hợp lệ.');
  return { source: 'buy_now' as const, ma_san_pham: productId, so_luong: quantity, ...(variantId === undefined ? {} : { ma_bien_the: variantId }) };
}

export interface CheckoutItem {
  ma_bien_the?: number | null;
  ten_bien_the?: string | null;
  ma_san_pham: number;
  ten_san_pham: string;
  so_luong: number;
  gia_ban: number | string;
  ton_kho: number;
  trang_thai: string;
  hinh_anh?: string;
}

export function summarizeCart(items: CheckoutItem[]) {
  const sorted = [...items].sort((a, b) => a.ma_san_pham - b.ma_san_pham || (a.ma_bien_the || 0) - (b.ma_bien_the || 0));
  const issues: string[] = [];
  let cents = 0;
  for (const item of sorted) {
    if (!Number.isInteger(item.so_luong) || item.so_luong < 1 || item.so_luong > 999) issues.push(`Số lượng của ${item.ten_san_pham} không hợp lệ.`);
    if (item.trang_thai !== 'DangBan') issues.push(`${item.ten_san_pham} hiện không bán.`);
    else if (item.so_luong > item.ton_kho) issues.push(`${item.ten_san_pham} chỉ còn ${item.ton_kho} sản phẩm.`);
    const price = Math.round(Number(item.gia_ban) * 100);
    if (!Number.isSafeInteger(price) || price <= 0) issues.push(`Giá của ${item.ten_san_pham} chưa hợp lệ.`);
    cents += price * item.so_luong;
  }
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999999999999999) issues.push('Giá trị đơn hàng vượt giới hạn cho phép.');
  const total = Number.isSafeInteger(cents) && cents >= 0 ? cents / 100 : 0;
  const snapshot = createHash('sha256').update(JSON.stringify(sorted.map(item => item.ma_bien_the ? [item.ma_san_pham, item.ten_san_pham, item.so_luong, Number(item.gia_ban), item.ma_bien_the, item.ten_bien_the] : [item.ma_san_pham, item.ten_san_pham, item.so_luong, Number(item.gia_ban)]))).digest('hex');
  return { items: sorted, tam_tinh: total, phi_giao_hang: 0, tong_tien: total, snapshot, issues, can_checkout: items.length > 0 && issues.length === 0, phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang' as const };
}

export function validateCheckout(body: Record<string, unknown>) {
  const text = (key: string) => typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  const name = text('ho_ten_nguoi_nhan');
  const phone = text('so_dien_thoai').replace(/[\s().-]/g, '').replace(/^\+84/, '0');
  const address = text('dia_chi_giao_hang');
  const note = text('ghi_chu');
  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 100) errors.ho_ten_nguoi_nhan = 'Nhập họ tên từ 2 đến 100 ký tự.';
  if (!/^0[35789]\d{8}$/.test(phone)) errors.so_dien_thoai = 'Nhập số điện thoại di động Việt Nam hợp lệ.';
  if (address.length < 10 || address.length > 255) errors.dia_chi_giao_hang = 'Nhập địa chỉ đầy đủ từ 10 đến 255 ký tự.';
  if (note.length > 1000) errors.ghi_chu = 'Ghi chú tối đa 1.000 ký tự.';
  if (body.phuong_thuc_thanh_toan !== 'ThanhToanKhiNhanHang') errors.phuong_thuc_thanh_toan = 'Hiện chỉ hỗ trợ thanh toán khi nhận hàng (COD).';
  if (Object.keys(errors).length) throw new CheckoutError(400, 'Vui lòng kiểm tra thông tin nhận hàng.', errors);
  const requestId = text('request_id');
  const snapshot = text('snapshot');
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId) || !/^[a-f0-9]{64}$/.test(snapshot)) throw new CheckoutError(400, 'Vui lòng tải lại trang thanh toán trước khi đặt hàng.');
  return { ho_ten_nguoi_nhan: name, so_dien_thoai: phone, dia_chi_giao_hang: address, ghi_chu: note, phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang', request_id: requestId, snapshot, ...checkoutSelection(body) };
}
