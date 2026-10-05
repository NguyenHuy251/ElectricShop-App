import { readFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';

try {
  await pool.query(await readFile(new URL('../migrations/001_checkout.sql', import.meta.url), 'utf8'));
  console.log('001_checkout.sql applied. Existing data preserved.');

  const [columns] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lien_he' AND COLUMN_NAME IN ('phan_hoi', 'ngay_phan_hoi')",
  );
  const existing = new Set(columns.map(column => column.COLUMN_NAME));
  if (!existing.has('phan_hoi')) await pool.query('ALTER TABLE lien_he ADD COLUMN phan_hoi TEXT NULL AFTER noi_dung');
  if (!existing.has('ngay_phan_hoi')) await pool.query('ALTER TABLE lien_he ADD COLUMN ngay_phan_hoi DATETIME NULL AFTER phan_hoi');
  console.log('003_contact_replies.sql applied. Existing data preserved.');

  await pool.query("ALTER TABLE lien_he MODIFY COLUMN trang_thai ENUM('ChuaXuLy', 'DangXuLy', 'DaXuLy', 'ChoPhanHoi', 'DaPhanHoi') DEFAULT 'ChoPhanHoi'");
  await pool.query("UPDATE lien_he SET trang_thai = 'ChoPhanHoi' WHERE trang_thai IN ('ChuaXuLy', 'DangXuLy')");
  await pool.query("UPDATE lien_he SET trang_thai = 'DaPhanHoi' WHERE trang_thai = 'DaXuLy'");
  await pool.query("ALTER TABLE lien_he MODIFY COLUMN trang_thai ENUM('ChoPhanHoi', 'DaPhanHoi') DEFAULT 'ChoPhanHoi'");
  console.log('004_contact_statuses.sql applied. Existing data preserved.');

  await pool.query(await readFile(new URL('../migrations/005_product_variants.sql', import.meta.url), 'utf8'));
  await pool.query(
    "INSERT IGNORE INTO san_pham_bien_the (ma_san_pham, ma_sku, ten_bien_the, gia_ban, so_luong) VALUES (1, 'TL001-180L', '180 lít', 6990000, 10), (1, 'TL001-236L', '236 lít', 7990000, 20), (1, 'TL001-300L', '300 lít', 9490000, 8), (21, 'Q001-DEN', 'Màu đen', 1290000, 12), (21, 'Q001-TRANG', 'Màu trắng', 1290000, 13)",
  );
  console.log('005_product_variants.sql applied. Sample product variants preserved.');
} finally { await pool.end(); }
 