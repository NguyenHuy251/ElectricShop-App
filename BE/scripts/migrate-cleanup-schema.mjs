import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const REDUNDANT_TABLES = [
  'bien_the_san_pham',
  'tai_khoan_dia_chi',
  'phieu_kho',
  'bien_dong_kho',
  'yeu_cau_hau_mai',
  'lich_su_hau_mai',
  'lich_su_don_hang',
  'san_pham_yeu_thich',
  'nhat_ky_thao_tac',
  'password_reset',
  'email_verification',
];

export async function migrateCleanupSchema(connection) {
  console.log('[Migration 014_cleanup_schema] Bắt đầu dọn dẹp các bảng dư thừa/trùng lặp...');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of REDUNDANT_TABLES) {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`  - Đã loại bỏ bảng: ${table}`);
    }
  } finally {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }
  console.log('[Migration 014_cleanup_schema] Hoàn tất dọn dẹp schema! Database đã được tinh gọn.');
}

if (process.argv[1]?.endsWith('migrate-cleanup-schema.mjs')) {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'electric_shop',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    const conn = await pool.getConnection();
    try {
      await migrateCleanupSchema(conn);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Lỗi dọn dẹp schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
