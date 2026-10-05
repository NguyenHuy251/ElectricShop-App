import { readFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';
try {
  await pool.query(await readFile(new URL('../migrations/001_checkout.sql', import.meta.url), 'utf8'));
  await pool.query(await readFile(new URL('../migrations/002_product_variants.sql', import.meta.url), 'utf8'));
  for (const sql of (await readFile(new URL('../migrations/003_vouchers.sql', import.meta.url), 'utf8')).split(';').filter(sql => sql.trim())) await pool.query(sql);
  const [triggers] = await pool.query("SHOW TRIGGERS WHERE `Trigger` = 'voucher_refund_on_cancel'");
  if (!triggers.length) await pool.query("CREATE TRIGGER voucher_refund_on_cancel AFTER UPDATE ON don_hang FOR EACH ROW UPDATE voucher_su_dung SET hoan_luot = 1 WHERE ma_don_hang = NEW.ma_don_hang AND NEW.trang_thai = 'DaHuy' AND OLD.trang_thai <> 'DaHuy'");
  console.log('Checkout, variants and vouchers migrated. Existing data preserved.');
} finally { await pool.end(); }
