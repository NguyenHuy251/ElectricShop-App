import { pool } from '../dist/config/database.js';

export async function migrateVouchers() {
  const connection = await pool.getConnection();
  try {
    // 1. Add missing professional columns to voucher table
    const [voucherCols] = await connection.query('SHOW COLUMNS FROM voucher');
    const existingFields = new Set(voucherCols.map(c => c.Field));

    if (!existingFields.has('loai')) {
      await connection.query("ALTER TABLE voucher ADD COLUMN loai ENUM('SoTien', 'PhanTram') NOT NULL DEFAULT 'SoTien' AFTER giam_tien");
    }
    if (!existingFields.has('giam_toi_da')) {
      await connection.query("ALTER TABLE voucher ADD COLUMN giam_toi_da DECIMAL(15,2) NULL AFTER loai");
    }
    if (!existingFields.has('moi_khach')) {
      await connection.query("ALTER TABLE voucher ADD COLUMN moi_khach INT NOT NULL DEFAULT 1 AFTER so_luot");
    }
    if (!existingFields.has('la_cong_khai')) {
      await connection.query("ALTER TABLE voucher ADD COLUMN la_cong_khai BOOLEAN NOT NULL DEFAULT TRUE AFTER moi_khach");
    }
    if (!existingFields.has('mo_ta')) {
      await connection.query("ALTER TABLE voucher ADD COLUMN mo_ta VARCHAR(255) NULL AFTER ket_thuc");
    }

    // 2. Create tai_khoan_voucher (Voucher Wallet)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tai_khoan_voucher (
        ma_tk_voucher INT AUTO_INCREMENT PRIMARY KEY,
        ma_tai_khoan INT NOT NULL,
        ma_voucher INT NOT NULL,
        so_luong INT NOT NULL DEFAULT 1,
        da_dung INT NOT NULL DEFAULT 0,
        ngay_nhan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ngay_het_han DATETIME NOT NULL,
        trang_thai ENUM('ChuaDung', 'DaDung', 'HetHan') NOT NULL DEFAULT 'ChuaDung',
        nguon_goc VARCHAR(50) NOT NULL DEFAULT 'HeThong',
        INDEX idx_tk_voucher_user (ma_tai_khoan, trang_thai),
        FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
        FOREIGN KEY (ma_voucher) REFERENCES voucher(ma_voucher) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 3. Mark reward vouchers as private (la_cong_khai = FALSE)
    const rewardCodes = [
      { code: 'CHECKIN7D', desc: 'Quà điểm danh liên tục 7 ngày: Giảm 30K cho đơn từ 200K' },
      { code: 'CHECKIN14D', desc: 'Quà điểm danh liên tục 14 ngày: Giảm 50K cho đơn từ 300K' },
      { code: 'CHECKIN30D', desc: 'Quà điểm danh liên tục 30 ngày: Giảm 100K cho đơn từ 500K' },
      { code: 'NEWBIE50K', desc: 'Quà tân thủ khi nhập mã giới thiệu: Giảm 50K cho đơn từ 250K' },
      { code: 'REFERRAL50K', desc: 'Quà tặng giới thiệu bạn bè thành công: Giảm 50K cho đơn từ 200K' },
      { code: 'REWARD20K', desc: 'Voucher đổi thưởng: Giảm 20K cho đơn từ 100K' },
      { code: 'REWARD50K', desc: 'Voucher đổi thưởng: Giảm 50K cho đơn từ 250K' },
      { code: 'REWARD100K', desc: 'Voucher đổi thưởng: Giảm 100K cho đơn từ 500K' },
      { code: 'FREESHIP15K', desc: 'Voucher đổi thưởng: Miễn phí vận chuyển 15K cho đơn từ 150K' },
    ];

    for (const item of rewardCodes) {
      await connection.query(
        'UPDATE voucher SET la_cong_khai = FALSE, moi_khach = 1, mo_ta = ? WHERE ma_code = ?',
        [item.desc, item.code]
      );
    }

    // 4. Ensure public vouchers exist for all customers
    const publicVouchers = [
      { code: 'ESHOP20K', loai: 'SoTien', giam_tien: 20000, giam_toi_da: null, don_toi_thieu: 150000, so_luot: 1000, moi_khach: 1, desc: 'Ưu đãi toàn sàn: Giảm 20K cho đơn từ 150K' },
      { code: 'ESHOP10PT', loai: 'PhanTram', giam_tien: 10, giam_toi_da: 50000, don_toi_thieu: 200000, so_luot: 1000, moi_khach: 1, desc: 'Ưu đãi toàn sàn: Giảm 10% (tối đa 50K) cho đơn từ 200K' },
      { code: 'FREESHIP15', loai: 'SoTien', giam_tien: 15000, giam_toi_da: null, don_toi_thieu: 250000, so_luot: 1000, moi_khach: 1, desc: 'Miễn phí giao hàng: Giảm 15K phí vận chuyển cho đơn từ 250K' },
      { code: 'VIP100K', loai: 'SoTien', giam_tien: 100000, giam_toi_da: null, don_toi_thieu: 1000000, so_luot: 500, moi_khach: 1, desc: 'Ưu đãi đơn lớn: Giảm 100K cho đơn từ 1.000.000đ' },
    ];

    for (const v of publicVouchers) {
      await connection.query(`
        INSERT INTO voucher (ma_code, loai, giam_tien, giam_toi_da, don_toi_thieu, so_luot, moi_khach, la_cong_khai, bat_dau, ket_thuc, trang_thai, mo_ta)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, ?)
        ON DUPLICATE KEY UPDATE
          loai = VALUES(loai),
          giam_tien = VALUES(giam_tien),
          giam_toi_da = VALUES(giam_toi_da),
          don_toi_thieu = VALUES(don_toi_thieu),
          la_cong_khai = TRUE,
          moi_khach = VALUES(moi_khach),
          mo_ta = VALUES(mo_ta),
          trang_thai = TRUE
      `, [v.code, v.loai, v.giam_tien, v.giam_toi_da, v.don_toi_thieu, v.so_luot, v.moi_khach, v.desc]);
    }

    console.log('012_vouchers_advanced migration applied successfully.');
  } finally {
    connection.release();
  }
}

if (process.argv[1]?.endsWith('migrate-vouchers.mjs')) {
  try {
    await migrateVouchers();
  } finally {
    await pool.end();
  }
}
