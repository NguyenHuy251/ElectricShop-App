import type { Pool, PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database.js';
import { CheckoutError } from '../utils/checkout.js';

type Database = Pool | PoolConnection;
let layout: Promise<boolean> | undefined;
async function legacyLayout() {
  layout ||= pool.query('SHOW COLUMNS FROM voucher').then(([rows]) => (rows as { Field: string }[]).some(row => row.Field === 'code')).catch(error => { layout = undefined; throw error; });
  return layout;
}

export type Voucher = {
  ma_voucher: number; ma_code: string; giam_tien: number | string; don_toi_thieu: number | string;
  so_luot: number; da_dung: number; trang_thai: number; bat_dau: Date; ket_thuc: Date;
  loai?: 'SoTien' | 'PhanTram'; giam_toi_da?: number | string | null; moi_khach?: number;
  da_dung_cua_khach?: number;
};

const legacyFields = `v.ma_voucher,v.code AS ma_code,v.gia_tri AS giam_tien,v.don_toi_thieu,
  v.gioi_han AS so_luot,v.hoat_dong AS trang_thai,v.bat_dau,v.ket_thuc,v.loai,v.giam_toi_da,v.moi_khach`;

export async function listVouchers(accountId?: number) {
  const legacy = await legacyLayout();
  const sql = legacy ? `SELECT ${legacyFields},
    (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung,
    (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach
    FROM voucher v ORDER BY v.ma_voucher DESC` : 'SELECT * FROM voucher ORDER BY ma_voucher DESC';
  const [rows] = await pool.query(sql, legacy ? [accountId ?? null] : []);
  return rows as Voucher[];
}

export function voucherIssue(voucher: Voucher, subtotal?: number): string {
  const now = Date.now();
  if (!voucher.trang_thai || now < new Date(voucher.bat_dau).getTime() || now > new Date(voucher.ket_thuc).getTime()) return 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn.';
  if (voucher.da_dung >= voucher.so_luot) return 'Mã giảm giá đã hết lượt.';
  if (voucher.moi_khach && (voucher.da_dung_cua_khach || 0) >= voucher.moi_khach) return 'Bạn đã dùng hết lượt của mã giảm giá này.';
  const amount = Number(voucher.giam_tien), cap = voucher.giam_toi_da;
  if (!Number.isFinite(amount) || amount <= 0 || (voucher.loai === 'PhanTram' && amount > 100) || (cap != null && (!Number.isFinite(Number(cap)) || Number(cap) <= 0))) return 'Giá trị mã giảm giá không hợp lệ.';
  if (subtotal !== undefined && subtotal < Number(voucher.don_toi_thieu)) return `Đơn hàng cần tối thiểu ${Number(voucher.don_toi_thieu).toLocaleString('vi-VN')}đ để dùng mã này.`;
  return '';
}

export async function customerVouchers(accountId: number, subtotal?: number) {
  const now = Date.now();
  return (await listVouchers(accountId))
    .filter(v => v.trang_thai && new Date(v.bat_dau).getTime() <= now && new Date(v.ket_thuc).getTime() >= now)
    .map(v => {
      const reason = voucherIssue(v, subtotal);
      return { ma_voucher: v.ma_voucher, ma_code: v.ma_code, giam_tien: Number(v.giam_tien), loai: v.loai || 'SoTien',
        giam_toi_da: v.giam_toi_da == null ? null : Number(v.giam_toi_da), don_toi_thieu: Number(v.don_toi_thieu),
        ket_thuc: v.ket_thuc, co_the_dung: !reason, ly_do: reason };
    });
}

export async function findVoucher(db: Database, code: string, lock: boolean, accountId?: number) {
  const legacy = await legacyLayout();
  const [rows] = await db.query(legacy
    ? `SELECT ${legacyFields} FROM voucher v WHERE v.code=?${lock ? ' FOR UPDATE' : ''}`
    : 'SELECT * FROM voucher WHERE ma_code=?' + (lock ? ' FOR UPDATE' : ''), [code]);
  const voucher = (rows as Voucher[])[0];
  if (legacy && voucher) {
    // Read usage after acquiring the voucher lock so the final remaining use cannot be oversold.
    const [usage] = await db.query(`SELECT COUNT(*) AS da_dung,
      COALESCE(SUM(ma_tai_khoan=?),0) AS da_dung_cua_khach FROM voucher_su_dung WHERE ma_voucher=? AND hoan_luot=0`, [accountId ?? null, voucher.ma_voucher]);
    Object.assign(voucher, (usage as { da_dung: number; da_dung_cua_khach: number }[])[0]);
  }
  return voucher;
}

export async function createVoucher(input: { ma_code: string; giam_tien: number; don_toi_thieu: number; so_luot: number; bat_dau: Date; ket_thuc: Date }) {
  const legacy = await legacyLayout();
  if (legacy && input.ma_code.length > 32) throw new CheckoutError(400, 'Mã giảm giá tối đa 32 ký tự.');
  try {
    await pool.execute(legacy
      ? "INSERT INTO voucher (code,loai,gia_tri,don_toi_thieu,gioi_han,bat_dau,ket_thuc) VALUES (?,'SoTien',?,?,?,?,?)"
      : 'INSERT INTO voucher (ma_code,giam_tien,don_toi_thieu,so_luot,bat_dau,ket_thuc) VALUES (?,?,?,?,?,?)',
      [input.ma_code,input.giam_tien,input.don_toi_thieu,input.so_luot,input.bat_dau,input.ket_thuc]);
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new CheckoutError(409, 'Mã đã tồn tại.');
    throw error;
  }
}

export async function setVoucherActive(id: number, active: boolean) {
  const column = await legacyLayout() ? 'hoat_dong' : 'trang_thai';
  const [result] = await pool.execute(`UPDATE voucher SET ${column}=? WHERE ma_voucher=?`, [active,id]);
  if (!(result as { affectedRows: number }).affectedRows) throw new CheckoutError(404, 'Mã giảm giá không tồn tại.');
}

export async function recordVoucherUsage(db: Database, orderId: number, accountId: number, quote: { ma_voucher: number | null; ma_code: string; tam_tinh: number; giam_gia: number }) {
  if (!quote.ma_voucher) return;
  if (await legacyLayout()) {
    await db.execute('INSERT INTO voucher_su_dung (ma_don_hang,ma_voucher,ma_tai_khoan,code,tam_tinh,tien_giam) VALUES (?,?,?,?,?,?)',
      [orderId,quote.ma_voucher,accountId,quote.ma_code,quote.tam_tinh,quote.giam_gia]);
  } else {
    await db.execute('UPDATE voucher SET da_dung=da_dung+1 WHERE ma_voucher=?', [quote.ma_voucher]);
  }
}
