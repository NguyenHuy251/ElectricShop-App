import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dien_gia_dung',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(dbConfig);

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully.');

    // Ensure essential columns and tables exist for sessions
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM tai_khoan LIKE 'token_version'");
      if (!(columns as any[]).length) {
        await connection.query('ALTER TABLE tai_khoan ADD COLUMN token_version INT NOT NULL DEFAULT 0');
        console.log('Ensured token_version column in tai_khoan.');
      }
      await connection.query(`
        CREATE TABLE IF NOT EXISTS staff_permissions (
          ma_tai_khoan INT NOT NULL PRIMARY KEY,
          permissions JSON NOT NULL,
          FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
        )
      `);
      await connection.query(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
          ma_tai_khoan INT NOT NULL,
          token_version INT NOT NULL,
          expires_at DATETIME NOT NULL,
          FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
        )
      `);
    } catch (migErr) {
      console.warn('Auto-schema check note:', (migErr as Error).message);
    }

    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}
