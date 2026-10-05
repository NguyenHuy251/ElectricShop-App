import { createHash } from 'node:crypto';
import type { Pool, PoolConnection } from 'mysql2/promise';
import { CheckoutError, summarizeCart } from '../utils/checkout.js';
export function voucherCode(value: unknown) {
 if (value === undefined || value === null || value === '') return '';
 if (typeof value !== 'string' || !/^[A-Z0-9_-]{3,32}$/.test(value.trim().toUpperCase())) throw new CheckoutError(400, 'Mã giảm giá không hợp lệ');
 return value.trim().toUpperCase();
}
export type Voucher = { ma_voucher:number; code:string; loai:string; gia_tri:number; don_toi_thieu:number; giam_toi_da:number|null; bat_dau:Date; ket_thuc:Date; gioi_han:number; moi_khach:number; hoat_dong:number };
export function discount(v: Voucher, subtotal:number, totalUses:number, userUses:number, now=new Date()) {
 if (!v.hoat_dong || now < new Date(v.bat_dau) || now >= new Date(v.ket_thuc)) throw new CheckoutError(409, 'Mã chưa bắt đầu, đã hết hạn hoặc ngừng hoạt động');
 if (subtotal < Number(v.don_toi_thieu)) throw new CheckoutError(409, `Đơn hàng chưa đạt giá trị tối thiểu ${Number(v.don_toi_thieu).toLocaleString('vi-VN')}đ`);
 if (totalUses >= v.gioi_han) throw new CheckoutError(409, 'Mã đã hết lượt sử dụng');
 if (userUses >= v.moi_khach) throw new CheckoutError(409, 'Bạn đã dùng hết lượt của mã này');
 let amount = v.loai === 'PhanTram' ? Math.floor(subtotal * Number(v.gia_tri) / 100) : Number(v.gia_tri);
 if (v.giam_toi_da != null) amount = Math.min(amount, Number(v.giam_toi_da));
 return Math.min(subtotal, Math.floor(amount));
}
export async function applyVoucher(db:Pool|PoolConnection, quote:ReturnType<typeof summarizeCart>, code:string, userId:number, role:string, lock=false) {
 if (!code) return {...quote, ma_giam_gia:'', tien_giam:0, voucher_id:null as number|null};
 if (role !== 'KhachHang') throw new CheckoutError(403, 'Mã giảm giá chỉ dành cho tài khoản khách hàng');
 if (!quote.can_checkout) throw new CheckoutError(409, 'Kiểm tra sản phẩm và tồn kho trước khi áp dụng mã');
 const [rows] = await db.query('SELECT * FROM voucher WHERE code = ?'+(lock?' FOR UPDATE':''),[code]);
 const v=(rows as Voucher[])[0]; if(!v) throw new CheckoutError(404, 'Mã giảm giá không tồn tại');
 const [counts]=await db.query('SELECT COUNT(*) AS total, COALESCE(SUM(ma_tai_khoan = ?),0) AS personal FROM voucher_su_dung WHERE ma_voucher = ? AND hoan_luot = 0',[userId,v.ma_voucher]);
 const count=(counts as {total:number;personal:number}[])[0];
 const amount=discount(v,quote.tam_tinh,Number(count.total),Number(count.personal));
 const snapshot=createHash('sha256').update(JSON.stringify([quote.snapshot,code,amount])).digest('hex');
 return {...quote, snapshot, ma_giam_gia:code, tien_giam:amount, voucher_id:v.ma_voucher, tong_tien:quote.tong_tien-amount};
}
