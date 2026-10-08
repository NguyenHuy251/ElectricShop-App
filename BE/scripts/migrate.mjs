import { readFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';
import { migrateCommerce } from './migrate-commerce.mjs';
import { migrateLocal } from './migrate-local.mjs';
import { migrateCollations } from './migrate-collations.mjs';
import { migratePermissions } from './migrate-permissions.mjs';

try {
  const collationConnection = await pool.getConnection();
  try { await migrateCollations(collationConnection); } finally { collationConnection.release(); }
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
  // Apply the variant schema before seeding specifications that use this column.
  const [variantColumns] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'san_pham_bien_the' AND COLUMN_NAME = 'thong_so_json'",
  );
  if (!variantColumns.length) await pool.query(await readFile(new URL('../migrations/006_variant_specifications.sql', import.meta.url), 'utf8'));
  console.log('006_variant_specifications.sql applied. Existing variants preserved.');

  await pool.query(
    "INSERT IGNORE INTO san_pham_bien_the (ma_san_pham, ma_sku, ten_bien_the, gia_ban, so_luong) VALUES (1, 'TL001-180L', '180 lít', 6990000, 10), (1, 'TL001-236L', '236 lít', 7990000, 20), (1, 'TL001-300L', '300 lít', 9490000, 8), (21, 'Q001-DEN', 'Màu đen', 1290000, 12), (21, 'Q001-TRANG', 'Màu trắng', 1290000, 13), (21, 'Q001-VANG', 'Màu vàng', 1290000, 5)",
  );
  const fanVariantSpecs = {
    black: JSON.stringify([
      { ma_thong_so: 1, ten_thong_so: 'Màu sắc', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Đen' },
      { ma_thong_so: 2, ten_thong_so: 'Xuất xứ', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Việt Nam' },
      { ma_thong_so: 5, ten_thong_so: 'Kích thước', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'TEXT', don_vi: 'cm', gia_tri: '45 x 45 x 135 cm' },
      { ma_thong_so: 10, ten_thong_so: 'Công suất', ten_nhom: 'Điện năng và hiệu suất', kieu_du_lieu: 'NUMBER', don_vi: 'W', gia_tri: '55', gia_tri_so: 55 },
      { ma_thong_so: 20, ten_thong_so: 'Số cánh quạt', ten_nhom: 'Thông tin kỹ thuật', kieu_du_lieu: 'NUMBER', don_vi: 'cánh', gia_tri: '3', gia_tri_so: 3 },
    ]),
    white: JSON.stringify([
      { ma_thong_so: 1, ten_thong_so: 'Màu sắc', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Trắng' },
      { ma_thong_so: 2, ten_thong_so: 'Xuất xứ', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Việt Nam' },
      { ma_thong_so: 5, ten_thong_so: 'Kích thước', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'TEXT', don_vi: 'cm', gia_tri: '45 x 45 x 135 cm' },
      { ma_thong_so: 10, ten_thong_so: 'Công suất', ten_nhom: 'Điện năng và hiệu suất', kieu_du_lieu: 'NUMBER', don_vi: 'W', gia_tri: '45', gia_tri_so: 45 },
      { ma_thong_so: 20, ten_thong_so: 'Số cánh quạt', ten_nhom: 'Thông số kỹ thuật', kieu_du_lieu: 'NUMBER', don_vi: 'cánh', gia_tri: '3', gia_tri_so: 3 },
    ]),
    yellow: JSON.stringify([
      { ma_thong_so: 1, ten_thong_so: 'Màu sắc', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Vàng' },
      { ma_thong_so: 2, ten_thong_so: 'Xuất xứ', ten_nhom: 'Thông tin cơ bản', kieu_du_lieu: 'TEXT', gia_tri: 'Việt Nam' },
      { ma_thong_so: 5, ten_thong_so: 'Kích thước', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'TEXT', don_vi: 'cm', gia_tri: '45 x 45 x 135 cm' },
      { ma_thong_so: 10, ten_thong_so: 'Công suất', ten_nhom: 'Điện năng và hiệu suất', kieu_du_lieu: 'NUMBER', don_vi: 'W', gia_tri: '65', gia_tri_so: 65 },
      { ma_thong_so: 20, ten_thong_so: 'Số cánh quạt', ten_nhom: 'Thông số kỹ thuật', kieu_du_lieu: 'NUMBER', don_vi: 'cánh', gia_tri: '5', gia_tri_so: 5 },
    ]),
  };
  await pool.execute('UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku = ?', [fanVariantSpecs.black, 'Q001-DEN']);
  await pool.execute('UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku = ?', [fanVariantSpecs.white, 'Q001-TRANG']);
  await pool.execute("UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku IN ('Q001-VANG', 'Q001-MAU-VANG') OR (ma_san_pham = 21 AND ten_bien_the = 'Màu vàng')", [fanVariantSpecs.yellow]);

  const fridgeVariantSpecs = {
    l180: JSON.stringify([
      { ma_thong_so: 6, ten_thong_so: 'Dung tích', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'NUMBER', don_vi: 'lít', gia_tri: '180 lít', gia_tri_so: 180 },
    ]),
    l236: JSON.stringify([
      { ma_thong_so: 6, ten_thong_so: 'Dung tích', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'NUMBER', don_vi: 'lít', gia_tri: '236 lít', gia_tri_so: 236 },
    ]),
    l300: JSON.stringify([
      { ma_thong_so: 6, ten_thong_so: 'Dung tích', ten_nhom: 'Kích thước và năng lực', kieu_du_lieu: 'NUMBER', don_vi: 'lít', gia_tri: '300 lít', gia_tri_so: 300 },
    ]),
  };
  await pool.execute('UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku = ?', [fridgeVariantSpecs.l180, 'TL001-180L']);
  await pool.execute('UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku = ?', [fridgeVariantSpecs.l236, 'TL001-236L']);
  await pool.execute('UPDATE san_pham_bien_the SET thong_so_json = ? WHERE ma_sku = ?', [fridgeVariantSpecs.l300, 'TL001-300L']);
  console.log('005_product_variants.sql applied. Sample product variants preserved.');

  const tiviMigration = await readFile(new URL('../migrations/007_tivi_category_specifications.sql', import.meta.url), 'utf8');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const statement of tiviMigration.split(';').map(sql => sql.trim()).filter(Boolean)) {
      await connection.query(statement);
    }
    await connection.commit();
    console.log('007_tivi_category_specifications.sql applied. Existing specifications preserved.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  await migrateCommerce();
  await migrateLocal();
  await migratePermissions();
} finally { await pool.end(); }

