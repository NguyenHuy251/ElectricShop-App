import { pool } from '../dist/config/database.js';

export async function migrateCommerce({ repairRoutines = true } = {}) {
  const connection = await pool.getConnection();
  try {
    for (const table of ['chi_tiet_gio_hang', 'chi_tiet_don_hang']) {
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
      const existing = new Set(columns.map(row => row.Field));
      const generatedVariantKey = columns.some(row => row.Field === 'variant_key' && /GENERATED/i.test(row.Extra || ''));
      if (!existing.has('ma_bien_the')) await connection.query(`ALTER TABLE ${table} ADD COLUMN ma_bien_the INT NULL`);
      if (table === 'chi_tiet_don_hang' && !existing.has('ten_bien_the')) await connection.query(`ALTER TABLE ${table} ADD COLUMN ten_bien_the VARCHAR(100) NULL`);
      if (!existing.has('variant_key')) {
        // NULL identifies legacy/base-product lines; zero makes their uniqueness enforceable.
        await connection.query(`ALTER TABLE ${table} ADD COLUMN variant_key INT NOT NULL DEFAULT 0`);
        const parent = table === 'chi_tiet_gio_hang' ? 'ma_gio_hang' : 'ma_don_hang';
        await connection.query(`ALTER TABLE ${table} ADD INDEX idx_parent (${parent}), ADD INDEX idx_product (ma_san_pham)`);
        await connection.query(`ALTER TABLE ${table} DROP PRIMARY KEY, ADD PRIMARY KEY (${parent}, ma_san_pham, variant_key)`);
      }
      for (const event of ['INSERT', 'UPDATE']) {
        const name = `${table}_variant_${event.toLowerCase()}`;
        const [triggers] = await connection.query('SELECT TRIGGER_NAME, ACTION_STATEMENT FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = ?', [name]);
        if (generatedVariantKey) {
          // A generated column is maintained by MySQL; assigning NEW.variant_key fails on insert/update.
          // Remove only the synchronization trigger created by this migration.
          if (triggers.length && /^SET\s+NEW\.variant_key\s*=\s*COALESCE\(NEW\.ma_bien_the,\s*0\)\s*;?$/i.test(triggers[0].ACTION_STATEMENT.trim())) {
            await connection.query(`DROP TRIGGER ${name}`);
          }
          continue;
        }
        if (!triggers.length) await connection.query(`CREATE TRIGGER ${name} BEFORE ${event} ON ${table} FOR EACH ROW SET NEW.variant_key = COALESCE(NEW.ma_bien_the, 0)`);
      }
    }
    for (const name of repairRoutines ? ['sp_don_hang_update_status', 'sp_don_hang_cancel'] : []) {
      const [rows] = await connection.query(`SHOW CREATE PROCEDURE ${name}`);
      const original = rows[0]['Create Procedure'];
      if (original.includes('san_pham_bien_the')) continue;
      const replacement = `UPDATE san_pham p JOIN (SELECT ma_san_pham, SUM(so_luong) AS so_luong FROM chi_tiet_don_hang WHERE ma_don_hang=p_id AND ma_bien_the IS NULL GROUP BY ma_san_pham) c ON c.ma_san_pham=p.ma_san_pham SET p.so_luong=p.so_luong+c.so_luong;
        UPDATE san_pham_bien_the v JOIN (SELECT ma_bien_the, SUM(so_luong) AS so_luong FROM chi_tiet_don_hang WHERE ma_don_hang=p_id AND ma_bien_the IS NOT NULL GROUP BY ma_bien_the) c ON c.ma_bien_the=v.ma_bien_the SET v.so_luong=v.so_luong+c.so_luong;`;
      const sql = original.replace(/UPDATE san_pham p JOIN chi_tiet_don_hang c[\s\S]*?WHERE c\.ma_don_hang\s*=\s*p_id;/i, replacement);
      if (sql === original) throw new Error(`Unrecognized stock restoration in ${name}`);
      await connection.query(`DROP PROCEDURE ${name}`);
      try { await connection.query(sql); } catch (error) { await connection.query(original); throw error; }
    }
    console.log('008_variant_checkout applied. Existing cart and order lines preserved.');
  } finally { connection.release(); }
}

if (process.argv[1]?.endsWith('migrate-commerce.mjs')) {
  try { await migrateCommerce(); } finally { await pool.end(); }
}
