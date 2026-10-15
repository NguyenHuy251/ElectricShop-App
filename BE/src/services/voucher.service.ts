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
  da_dung_cua_khach?: number; la_cong_khai?: number | boolean; mo_ta?: string | null;
  khong_thuoc_so_huu?: boolean;
};

const legacyFields = `v.ma_voucher,v.code AS ma_code,v.gia_tri AS giam_tien,v.don_toi_thieu,
  v.gioi_han AS so_luot,v.hoat_dong AS trang_thai,v.bat_dau,v.ket_thuc,v.loai,v.giam_toi_da,v.moi_khach`;

export async function listVouchers(accountId?: number) {
  const legacy = await legacyLayout();
  if (legacy) {
    const sql = `SELECT ${legacyFields},
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach
      FROM voucher v ORDER BY v.ma_voucher DESC`;
    const [rows] = await pool.query(sql, [accountId ?? null]);
    return rows as Voucher[];
  }

  const sql = `SELECT v.*,
    (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung_thuc_te,
    (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach
    FROM voucher v ORDER BY v.ma_voucher DESC`;
  const [rows] = await pool.query(sql, [accountId ?? null]);
  return (rows as any[]).map(v => ({
    ...v,
    da_dung: Math.max(Number(v.da_dung || 0), Number(v.da_dung_thuc_te || 0)),
  })) as Voucher[];
}

export function voucherIssue(voucher: Voucher, subtotal?: number): string {
  if (voucher.khong_thuoc_so_huu) {
    return 'Mã giảm giá này chỉ dành riêng cho tài khoản được tặng hoặc đổi thưởng hợp lệ.';
  }
  const now = Date.now();
  if (!voucher.trang_thai || now < new Date(voucher.bat_dau).getTime() || now > new Date(voucher.ket_thuc).getTime()) return 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn.';
  if (voucher.da_dung >= voucher.so_luot) return 'Mã giảm giá đã hết lượt sử dụng trên hệ thống.';
  if (voucher.moi_khach && (voucher.da_dung_cua_khach || 0) >= voucher.moi_khach) return 'Bạn đã dùng hết lượt của mã giảm giá này.';
  const amount = Number(voucher.giam_tien), cap = voucher.giam_toi_da;
  if (!Number.isFinite(amount) || amount <= 0 || (voucher.loai === 'PhanTram' && amount > 100) || (cap != null && (!Number.isFinite(Number(cap)) || Number(cap) <= 0))) return 'Giá trị mã giảm giá không hợp lệ.';
  if (subtotal !== undefined && subtotal < Number(voucher.don_toi_thieu)) return `Đơn hàng cần tối thiểu ${Number(voucher.don_toi_thieu).toLocaleString('vi-VN')}đ để dùng mã này.`;
  return '';
}

export async function customerVouchers(accountId: number, subtotal?: number) {
  const legacy = await legacyLayout();
  if (legacy) {
    const now = Date.now();
    return (await listVouchers(accountId))
      .filter(v => v.trang_thai && new Date(v.bat_dau).getTime() <= now && new Date(v.ket_thuc).getTime() >= now)
      .map(v => {
        const reason = voucherIssue(v, subtotal);
        return { ma_voucher: v.ma_voucher, ma_code: v.ma_code, giam_tien: Number(v.giam_tien), loai: v.loai || 'SoTien',
          giam_toi_da: v.giam_toi_da == null ? null : Number(v.giam_toi_da), don_toi_thieu: Number(v.don_toi_thieu),
          ket_thuc: v.ket_thuc, co_the_dung: !reason, ly_do: reason, la_cong_khai: true, nguon_goc: 'Toàn sàn', mo_ta: null };
      });
  }

  const now = Date.now();

  // 1. Fetch public vouchers available to this customer
  const [publicRows] = await pool.query(
    `SELECT v.*,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung_thuc_te,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach,
      'Toàn sàn' AS nguon_goc
     FROM voucher v
     WHERE v.la_cong_khai = TRUE AND v.trang_thai = TRUE
       AND NOW() BETWEEN v.bat_dau AND v.ket_thuc
     ORDER BY v.don_toi_thieu ASC`,
    [accountId]
  );

  // 2. Fetch personal/reward vouchers owned by this customer in their wallet
  const [walletRows] = await pool.query(
    `SELECT v.*,
      tv.ma_tk_voucher, tv.ngay_het_han, tv.nguon_goc, tv.trang_thai AS trang_thai_vi,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung_thuc_te,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach
     FROM tai_khoan_voucher tv
     JOIN voucher v ON tv.ma_voucher = v.ma_voucher
     WHERE tv.ma_tai_khoan = ? AND tv.trang_thai = 'ChuaDung' AND tv.ngay_het_han >= NOW() AND v.trang_thai = TRUE
     ORDER BY tv.ngay_het_han ASC`,
    [accountId, accountId]
  );

  // Deduplicate vouchers by code (prioritize personal claimed version)
  const combinedMap = new Map<string, any>();

  // Gộp các bản sao trùng mã VÀ cùng hạn sử dụng thành một entry (kèm số lượt);
  // bản sao có hạn dùng khác nhau thì hiển thị riêng theo hạn của từng nhóm.
  const walletAgg = new Map<string, { item: any; copies: number; expiry: Date | null; sources: Set<string> }>();
  for (const item of (walletRows as any[])) {
    const expiry = item.ngay_het_han ? new Date(item.ngay_het_han) : null;
    const groupKey = `${item.ma_code}|${expiry ? expiry.toISOString() : String(item.ket_thuc ?? '')}`;
    const existing = walletAgg.get(groupKey);
    if (existing) {
      existing.copies += 1;
      existing.sources.add(mapNguonGoc(item.nguon_goc));
      continue;
    }
    walletAgg.set(groupKey, { item, copies: 1, expiry, sources: new Set([mapNguonGoc(item.nguon_goc)]) });
  }

  for (const { item, copies, expiry, sources } of walletAgg.values()) {
    const raw = {
      ...item,
      da_dung: Math.max(Number(item.da_dung || 0), Number(item.da_dung_thuc_te || 0)),
      la_cong_khai: false,
    };
    const reason = voucherIssue(raw, subtotal);
    combinedMap.set(item.ma_code, {
      ma_voucher: item.ma_voucher,
      ma_code: item.ma_code,
      giam_tien: Number(item.giam_tien),
      loai: item.loai || 'SoTien',
      giam_toi_da: item.giam_toi_da == null ? null : Number(item.giam_toi_da),
      don_toi_thieu: Number(item.don_toi_thieu),
      ket_thuc: expiry || item.ket_thuc,
      so_luong: copies,
      co_the_dung: !reason,
      ly_do: reason,
      la_cong_khai: false,
      nguon_goc: Array.from(sources).join(', '),
      mo_ta: item.mo_ta || null,
    });
  }

  for (const item of (publicRows as any[])) {
    if (combinedMap.has(item.ma_code)) continue;
    const raw = {
      ...item,
      da_dung: Math.max(Number(item.da_dung || 0), Number(item.da_dung_thuc_te || 0)),
      la_cong_khai: true,
    };
    const reason = voucherIssue(raw, subtotal);
    // Don't show public vouchers if the user already exhausted their per-user usage
    if (raw.moi_khach && (raw.da_dung_cua_khach || 0) >= raw.moi_khach && subtotal === undefined) {
      continue;
    }
    combinedMap.set(item.ma_code, {
      ma_voucher: item.ma_voucher,
      ma_code: item.ma_code,
      giam_tien: Number(item.giam_tien),
      loai: item.loai || 'SoTien',
      giam_toi_da: item.giam_toi_da == null ? null : Number(item.giam_toi_da),
      don_toi_thieu: Number(item.don_toi_thieu),
      ket_thuc: item.ket_thuc,
      so_luong: 1,
      co_the_dung: !reason,
      ly_do: reason,
      la_cong_khai: true,
      nguon_goc: 'Toàn sàn',
      mo_ta: item.mo_ta || null,
    });
  }

  return Array.from(combinedMap.values());
}

function mapNguonGoc(raw?: string): string {
  if (!raw) return 'Ví voucher';
  switch (raw) {
    case 'TanThuGioiThieu': return 'Quà tân thủ';
    case 'GioiThieu': return 'Giới thiệu bạn bè';
    case 'DiemDanh7Ngay': return 'Quà điểm danh 7 ngày';
    case 'DiemDanh14Ngay': return 'Quà điểm danh 14 ngày';
    case 'DiemDanh30Ngay': return 'Quà điểm danh 30 ngày';
    case 'VongQuayMayMan': return 'Vòng quay may mắn';
    case 'DoiXu': return 'Đổi Xu thưởng';
    case 'LuuMaThuCong': return 'Đã lưu vào ví';
    default: return 'Ví voucher';
  }
}

export async function findVoucher(db: Database, code: string, lock: boolean, accountId?: number) {
  const legacy = await legacyLayout();
  if (legacy) {
    const [rows] = await db.query(
      `SELECT ${legacyFields} FROM voucher v WHERE v.code=?${lock ? ' FOR UPDATE' : ''}`, [code]
    );
    const voucher = (rows as Voucher[])[0];
    if (voucher) {
      const [usage] = await db.query(
        `SELECT COUNT(*) AS da_dung,
         COALESCE(SUM(ma_tai_khoan=?),0) AS da_dung_cua_khach FROM voucher_su_dung WHERE ma_voucher=? AND hoan_luot=0`,
        [accountId ?? null, voucher.ma_voucher]
      );
      Object.assign(voucher, (usage as { da_dung: number; da_dung_cua_khach: number }[])[0]);
    }
    return voucher;
  }

  const [rows] = await db.query(
    `SELECT v.*,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0) AS da_dung_thuc_te,
      (SELECT COUNT(*) FROM voucher_su_dung u WHERE u.ma_voucher=v.ma_voucher AND u.hoan_luot=0 AND u.ma_tai_khoan=?) AS da_dung_cua_khach
     FROM voucher v WHERE v.ma_code=?${lock ? ' FOR UPDATE' : ''}`,
    [accountId ?? null, code]
  );
  const voucher = (rows as Voucher[])[0];
  if (!voucher) return undefined;

  voucher.da_dung = Math.max(Number(voucher.da_dung || 0), Number((voucher as any).da_dung_thuc_te || 0));

  // Check ownership if it's a private voucher
  const isPublic = voucher.la_cong_khai !== undefined ? Boolean(voucher.la_cong_khai) : true;
  if (!isPublic) {
    if (!accountId) {
      voucher.khong_thuoc_so_huu = true;
    } else {
      const [wallet] = await db.query(
        `SELECT * FROM tai_khoan_voucher
         WHERE ma_tai_khoan = ? AND ma_voucher = ? AND trang_thai = 'ChuaDung' AND ngay_het_han >= NOW()
         ORDER BY ngay_nhan ASC LIMIT 1`,
        [accountId, voucher.ma_voucher]
      );
      if (!(wallet as any[]).length) {
        voucher.khong_thuoc_so_huu = true;
      }
    }
  }

  return voucher;
}

export async function createVoucher(input: {
  ma_code: string; giam_tien: number; don_toi_thieu: number; so_luot: number; bat_dau: Date; ket_thuc: Date;
  loai?: 'SoTien' | 'PhanTram'; giam_toi_da?: number | null; moi_khach?: number; la_cong_khai?: boolean; mo_ta?: string;
}) {
  const legacy = await legacyLayout();
  if (legacy && input.ma_code.length > 32) throw new CheckoutError(400, 'Mã giảm giá tối đa 32 ký tự.');
  try {
    if (legacy) {
      await pool.execute(
        "INSERT INTO voucher (code,loai,gia_tri,don_toi_thieu,gioi_han,bat_dau,ket_thuc) VALUES (?,'SoTien',?,?,?,?,?)",
        [input.ma_code,input.giam_tien,input.don_toi_thieu,input.so_luot,input.bat_dau,input.ket_thuc]
      );
    } else {
      await pool.execute(
        `INSERT INTO voucher (ma_code,loai,giam_tien,giam_toi_da,don_toi_thieu,so_luot,moi_khach,la_cong_khai,bat_dau,ket_thuc,mo_ta)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          input.ma_code,
          input.loai || 'SoTien',
          input.giam_tien,
          input.giam_toi_da ?? null,
          input.don_toi_thieu,
          input.so_luot,
          input.moi_khach ?? 1,
          input.la_cong_khai ?? true,
          input.bat_dau,
          input.ket_thuc,
          input.mo_ta || null,
        ]
      );
    }
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
  const legacy = await legacyLayout();
  if (legacy) {
    await db.execute('INSERT INTO voucher_su_dung (ma_don_hang,ma_voucher,ma_tai_khoan,code,tam_tinh,tien_giam) VALUES (?,?,?,?,?,?)',
      [orderId,quote.ma_voucher,accountId,quote.ma_code,quote.tam_tinh,quote.giam_gia]);
    return;
  }

  // 1. Record usage in voucher_su_dung
  await db.execute(
    'INSERT INTO voucher_su_dung (ma_don_hang,ma_voucher,ma_tai_khoan,code,tam_tinh,tien_giam,hoan_luot) VALUES (?,?,?,?,?,?,0)',
    [orderId, quote.ma_voucher, accountId, quote.ma_code, quote.tam_tinh, quote.giam_gia]
  );

  // 2. Increment global usage
  await db.execute('UPDATE voucher SET da_dung=da_dung+1 WHERE ma_voucher=?', [quote.ma_voucher]);

  // 3. Mark in user wallet if exists
  await db.execute(
    `UPDATE tai_khoan_voucher SET da_dung = da_dung + 1, trang_thai = 'DaDung'
     WHERE ma_tai_khoan = ? AND ma_voucher = ? AND trang_thai = 'ChuaDung'
     ORDER BY ngay_nhan ASC LIMIT 1`,
    [accountId, quote.ma_voucher]
  );
}

export async function grantVoucherToUser(db: Database, accountId: number, voucherCode: string, source: string, expiryDays = 30) {
  const [rows] = await db.query('SELECT ma_voucher, ket_thuc FROM voucher WHERE ma_code = ?', [voucherCode]);
  const voucher = (rows as any[])[0];
  if (!voucher) return null;

  const now = new Date();
  const maxExpiry = new Date(voucher.ket_thuc);
  const targetExpiry = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const expiry = targetExpiry < maxExpiry ? targetExpiry : maxExpiry;

  await db.execute(
    `INSERT INTO tai_khoan_voucher (ma_tai_khoan, ma_voucher, so_luong, da_dung, ngay_nhan, ngay_het_han, trang_thai, nguon_goc)
     VALUES (?, ?, 1, 0, NOW(), ?, 'ChuaDung', ?)`,
    [accountId, voucher.ma_voucher, expiry, source]
  );
  return voucher.ma_voucher;
}

export async function claimVoucherByCode(accountId: number, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  const [rows] = await pool.query('SELECT * FROM voucher WHERE ma_code = ?', [code]);
  const voucher = (rows as any[])[0];
  if (!voucher) throw new CheckoutError(404, 'Mã giảm giá không tồn tại.');
  if (!voucher.trang_thai || new Date(voucher.ket_thuc).getTime() < Date.now()) {
    throw new CheckoutError(400, 'Mã giảm giá chưa có hiệu lực hoặc đã hết hạn.');
  }
  if (voucher.da_dung >= voucher.so_luot) {
    throw new CheckoutError(400, 'Mã giảm giá đã hết lượt sử dụng trên hệ thống.');
  }

  // Check if user already used up their limit
  const [used] = await pool.query(
    'SELECT COUNT(*) as count FROM voucher_su_dung WHERE ma_voucher = ? AND ma_tai_khoan = ? AND hoan_luot = 0',
    [voucher.ma_voucher, accountId]
  );
  if ((used as any[])[0]?.count >= (voucher.moi_khach || 1)) {
    throw new CheckoutError(400, 'Bạn đã sử dụng hết lượt của mã giảm giá này.');
  }

  // If private voucher, can't just claim by guessing
  if (!voucher.la_cong_khai) {
    throw new CheckoutError(403, 'Mã giảm giá này là phần thưởng cá nhân, chỉ được cấp qua sự kiện hoặc đổi thưởng.');
  }

  // Check if user already claimed into wallet
  const [claimed] = await pool.query(
    "SELECT * FROM tai_khoan_voucher WHERE ma_tai_khoan = ? AND ma_voucher = ? AND trang_thai = 'ChuaDung'",
    [accountId, voucher.ma_voucher]
  );
  if ((claimed as any[]).length > 0) {
    throw new CheckoutError(400, 'Mã giảm giá này đã có sẵn trong ví của bạn.');
  }

  await grantVoucherToUser(pool, accountId, code, 'LuuMaThuCong', 30);
  return {
    message: `Đã lưu voucher ${code} vào ví thành công!`,
    data: {
      ma_code: code,
      giam_tien: Number(voucher.giam_tien),
      don_toi_thieu: Number(voucher.don_toi_thieu),
      ket_thuc: voucher.ket_thuc,
    },
  };
}
