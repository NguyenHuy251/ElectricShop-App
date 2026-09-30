// Restore missing routines only; never execute the schema reset or seed data.
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pool } from '../dist/config/database.js';

const apply = process.argv.includes('--apply');
const connection = await pool.getConnection();
try {
  const definitions = new Map();
  for (const file of ['database.sql', 'upgrade_product_management_resume_procedures.sql']) {
    const source = await readFile(new URL(`../database/${file}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/CREATE PROCEDURE\s+(\w+)\s*\([\s\S]*?\$\$/g)) {
      definitions.set(match[1], match[0].slice(0, -2));
    }
  }
  const [columns] = await connection.query("SELECT COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='san_pham' AND COLUMN_NAME='ten_san_pham'");
  const collation = columns[0]?.COLLATION_NAME;
  if (!/^utf8mb4_[a-z0-9_]+$/.test(collation || '')) throw new Error('Unsupported product collation');
  const normalize = sql => {
    const start = sql.search(/\bBEGIN\b/i);
    if (start < 0) throw new Error('Procedure body missing');
    const header = sql.slice(0, start).replace(/\b(VARCHAR\(\d+\)|CHAR\(\d+\)|TEXT)(?:\s+CHARACTER SET\s+\w+)?(?:\s+COLLATE\s+\w+)?/gi, `$1 CHARACTER SET utf8mb4 COLLATE ${collation}`);
    return header + sql.slice(start);
  };
  const [routines] = await connection.query('SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA=DATABASE()');
  const existing = new Set(routines.map(row => row.ROUTINE_NAME));
  const operations = [];
  for (const [name, sql] of definitions) {
    if (!existing.has(name)) operations.push({ name, sql: normalize(sql) });
  }
  // Preserve installed product logic and only correct text parameter collations.
  for (const name of ['sp_san_pham_list', 'sp_san_pham_find_by_code']) {
    if (!existing.has(name)) continue;
    const [parameters] = await connection.query('SELECT COLLATION_NAME FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA=DATABASE() AND SPECIFIC_NAME=? AND COLLATION_NAME IS NOT NULL', [name]);
    if (parameters.every(row => row.COLLATION_NAME === collation)) continue;
    const [rows] = await connection.query(`SHOW CREATE PROCEDURE \`${name}\``);
    const original = rows[0]['Create Procedure'];
    operations.push({ name, sql: normalize(original), original });
  }
  console.log(JSON.stringify({ apply, collation, operations: operations.map(({ name, original }) => ({ name, action: original ? 'repair-parameter-collation' : 'create-missing' })) }, null, 2));
  if (apply && operations.length) {
    const backup = await mkdtemp(join(tmpdir(), 'electric-procedures-'));
    await writeFile(join(backup, 'restore.sql'), 'DELIMITER $$\n' + operations.map(({ name, original }) => `DROP PROCEDURE IF EXISTS \`${name}\`$$\n${original ? original + '$$\n' : ''}`).join('\n') + '\nDELIMITER ;\n');
    console.log(`Procedure rollback saved: ${backup}`);
    for (const { name, sql, original } of operations) {
      if (original) await connection.query(`DROP PROCEDURE \`${name}\``);
      try { await connection.query(sql); }
      catch (error) { if (original) await connection.query(original); throw error; }
    }
    console.log(`Applied ${operations.length} procedure repairs; table data unchanged.`);
  }
} finally {
  connection.release();
  await pool.end();
}
