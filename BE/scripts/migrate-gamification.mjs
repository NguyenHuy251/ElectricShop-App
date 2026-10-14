import { pool } from '../dist/config/database.js';

export async function migrateGamification() {
  const connection = await pool.getConnection();
  try {
    // 1. Add columns to tai_khoan
    const [tkColumns] = await connection.query('SHOW COLUMNS FROM tai_khoan');
    const tkFields = new Set(tkColumns.map(row => row.Field));

    if (!tkFields.has('diem_thuong')) {
      await connection.query('ALTER TABLE tai_khoan ADD COLUMN diem_thuong INT NOT NULL DEFAULT 500');
    }
    if (!tkFields.has('ma_gioi_thieu')) {
      await connection.query('ALTER TABLE tai_khoan ADD COLUMN ma_gioi_thieu VARCHAR(30) NULL UNIQUE');
    }
    if (!tkFields.has('ma_nguoi_gioi_thieu')) {
      await connection.query('ALTER TABLE tai_khoan ADD COLUMN ma_nguoi_gioi_thieu INT NULL');
    }

    const [accounts] = await connection.query('SELECT ma_tai_khoan, ten_dang_nhap, ma_gioi_thieu FROM tai_khoan WHERE ma_gioi_thieu IS NULL');
    for (const acc of accounts) {
      const code = `ESHOP${acc.ma_tai_khoan}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      await connection.execute('UPDATE tai_khoan SET ma_gioi_thieu = ? WHERE ma_tai_khoan = ?', [code, acc.ma_tai_khoan]);
    }

    // 5. Ensure demo vouchers exist for rewards exchange and check-in gifts
    const rewardVouchers = [
      { code: 'CHECKIN7D', giam_tien: 30000, don_toi_thieu: 200000, so_luot: 1000 },
      { code: 'CHECKIN14D', giam_tien: 50000, don_toi_thieu: 300000, so_luot: 1000 },
      { code: 'CHECKIN30D', giam_tien: 100000, don_toi_thieu: 500000, so_luot: 1000 },
      { code: 'NEWBIE50K', giam_tien: 50000, don_toi_thieu: 250000, so_luot: 1000 },
      { code: 'SHAREAPP50', giam_tien: 50000, don_toi_thieu: 0, so_luot: 1000 },
      { code: 'REFERRAL50K', giam_tien: 50000, don_toi_thieu: 200000, so_luot: 1000 },
      { code: 'REWARD20K', giam_tien: 20000, don_toi_thieu: 100000, so_luot: 1000 },
      { code: 'REWARD50K', giam_tien: 50000, don_toi_thieu: 250000, so_luot: 1000 },
      { code: 'REWARD100K', giam_tien: 100000, don_toi_thieu: 500000, so_luot: 1000 },
      { code: 'FREESHIP15K', giam_tien: 15000, don_toi_thieu: 150000, so_luot: 1000 },
    ];

    for (const v of rewardVouchers) {
      await connection.query(`
        INSERT INTO voucher (ma_code, giam_tien, don_toi_thieu, so_luot, bat_dau, ket_thuc, trang_thai)
        VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE)
        ON DUPLICATE KEY UPDATE trang_thai = TRUE
      `, [v.code, v.giam_tien, v.don_toi_thieu, v.so_luot]);
    }

    console.log('011_gamification migration applied successfully.');
  } finally {
    connection.release();
  }
}

if (process.argv[1]?.endsWith('migrate-gamification.mjs')) {
  try {
    await migrateGamification();
  } finally {
    await pool.end();
  }
}
