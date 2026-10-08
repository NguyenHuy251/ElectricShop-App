import { pathToFileURL } from 'node:url';
import { pool } from '../dist/config/database.js';
import { migrateAuth, migrateParameters } from './migrate-auth.mjs';

export async function migrateCollations(connection, backupDirectory = new URL('../logs/collation-migrations/', import.meta.url)) {
  // A search parameter is compared with all three columns in the catalog routine.
  // Check their collations before selecting a single collation for the parameter.
  const [columns] = await connection.query(`SELECT CHARACTER_SET_NAME,COLLATION_NAME
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()
    AND ((TABLE_NAME='san_pham' AND COLUMN_NAME IN ('ten_san_pham','ma_san_pham_code'))
      OR (TABLE_NAME='danh_muc' AND COLUMN_NAME='ten_danh_muc'))`);
  if (columns.length !== 3 || new Set(columns.map(row => `${row.CHARACTER_SET_NAME}/${row.COLLATION_NAME}`)).size !== 1) {
    throw new Error('Catalog search columns must share a charset and collation; no routines were changed.');
  }
  await migrateAuth(connection, backupDirectory);
  await migrateParameters(connection, 'san_pham', {
    sp_san_pham_list: { p_search: 'ten_san_pham' },
    sp_san_pham_find_by_code: { p_code: 'ma_san_pham_code' },
  }, backupDirectory);
  await migrateParameters(connection, 'tai_khoan', {
    sp_tai_khoan_find_by_email: { p_email: 'email' },
  }, backupDirectory);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let connection;
  try { connection = await pool.getConnection(); await migrateCollations(connection); }
  finally { connection?.release(); await pool.end(); }
}
