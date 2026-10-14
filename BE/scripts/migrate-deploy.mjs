// Schema-only deployment migrations. Never reset a database or overwrite sample/product data.
import { pool } from '../dist/config/database.js';
import {
  CHECKOUT_REQUESTS_SQL,
  PRODUCT_VARIANTS_SQL,
  VARIANT_SPECIFICATIONS_SQL,
  TIVI_SPECIFICATIONS_SQL,
} from './schema-constants.mjs';
import { migrateCommerce } from './migrate-commerce.mjs';
import { migrateLocal } from './migrate-local.mjs';

try {
  const [tables]=await pool.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()");
  const names=new Set(tables.map(row=>row.TABLE_NAME));
  for(const name of ['tai_khoan','san_pham','danh_muc','thong_so','nhom_thong_so','lien_he','don_hang','chi_tiet_gio_hang','chi_tiet_don_hang']) {
    if(!names.has(name))throw new Error(`Database has not been imported: missing ${name}. Import the existing database backup before deployment.`);
  }
  await pool.query(CHECKOUT_REQUESTS_SQL);
  const [contacts]=await pool.query('SHOW COLUMNS FROM lien_he');
  if(!contacts.some(row=>row.Field==='phan_hoi'))await pool.query('ALTER TABLE lien_he ADD COLUMN phan_hoi TEXT NULL');
  if(!contacts.some(row=>row.Field==='ngay_phan_hoi'))await pool.query('ALTER TABLE lien_he ADD COLUMN ngay_phan_hoi DATETIME NULL');
  await pool.query("ALTER TABLE lien_he MODIFY COLUMN trang_thai ENUM('ChuaXuLy','DangXuLy','DaXuLy','ChoPhanHoi','DaPhanHoi') DEFAULT 'ChoPhanHoi'");
  await pool.query("UPDATE lien_he SET trang_thai='ChoPhanHoi' WHERE trang_thai IN ('ChuaXuLy','DangXuLy')");
  await pool.query("UPDATE lien_he SET trang_thai='DaPhanHoi' WHERE trang_thai='DaXuLy'");
  await pool.query("ALTER TABLE lien_he MODIFY COLUMN trang_thai ENUM('ChoPhanHoi','DaPhanHoi') DEFAULT 'ChoPhanHoi'");
  await pool.query(PRODUCT_VARIANTS_SQL);
  const [variants]=await pool.query('SHOW COLUMNS FROM san_pham_bien_the');
  if(!variants.some(row=>row.Field==='thong_so_json'))await pool.query(VARIANT_SPECIFICATIONS_SQL);
  for(const statement of TIVI_SPECIFICATIONS_SQL.split(';').map(s=>s.trim()).filter(Boolean))await pool.query(statement);
  await migrateCommerce();
  await migrateLocal();
  console.log('Schema migrations complete. Existing products, orders and variant data preserved.');
}finally{await pool.end();}
