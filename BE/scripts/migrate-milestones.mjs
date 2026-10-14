import { pool } from '../dist/config/database.js';

export async function migrateMilestones() {
  const connection = await pool.getConnection();
  try {
    // 1. Create lich_su_moc_diem_danh
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lich_su_moc_diem_danh (
        ma_moc_ls INT AUTO_INCREMENT PRIMARY KEY,
        ma_tai_khoan INT NOT NULL,
        moc_ngay INT NOT NULL,
        phan_thuong VARCHAR(255) NOT NULL,
        ma_voucher INT NULL,
        ngay_nhan DATETIME DEFAULT CURRENT_TIMESTAMP,
        chuoi_tai_thoi_diem INT NOT NULL DEFAULT 0,
        INDEX idx_user_moc (ma_tai_khoan, moc_ngay),
        FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Ensure milestone vouchers exist
    const milestoneVouchers = [
      { code: 'CHECKIN7D', giam_tien: 30000, don_toi_thieu: 200000, desc: 'Quà điểm danh liên tục 7 ngày: Giảm 30K cho đơn từ 200K' },
      { code: 'CHECKIN14D', giam_tien: 50000, don_toi_thieu: 300000, desc: 'Quà điểm danh liên tục 14 ngày: Giảm 50K cho đơn từ 300K' },
      { code: 'CHECKIN21D', giam_tien: 70000, don_toi_thieu: 400000, desc: 'Quà điểm danh liên tục 21 ngày: Giảm 70K cho đơn từ 400K' },
      { code: 'CHECKIN30D', giam_tien: 100000, don_toi_thieu: 500000, desc: 'Quà điểm danh liên tục 30 ngày: Giảm 100K cho đơn từ 500K' },
    ];

    for (const mv of milestoneVouchers) {
      await connection.query(`
        INSERT INTO voucher (ma_code, loai, giam_tien, don_toi_thieu, so_luot, moi_khach, la_cong_khai, bat_dau, ket_thuc, trang_thai, mo_ta)
        VALUES (?, 'SoTien', ?, ?, 2000, 1, FALSE, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, ?)
        ON DUPLICATE KEY UPDATE
          giam_tien = VALUES(giam_tien),
          don_toi_thieu = VALUES(don_toi_thieu),
          la_cong_khai = FALSE,
          trang_thai = TRUE,
          mo_ta = VALUES(mo_ta)
      `, [mv.code, mv.giam_tien, mv.don_toi_thieu, mv.desc]);
    }

    console.log('013_milestones migration applied successfully.');
  } finally {
    connection.release();
  }
}

if (process.argv[1]?.endsWith('migrate-milestones.mjs')) {
  try {
    await migrateMilestones();
  } finally {
    await pool.end();
  }
}
