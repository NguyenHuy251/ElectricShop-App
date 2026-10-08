import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { pool } from '../dist/config/database.js';

// Match comparison parameters to the actual columns, including imported databases.
// Changing the database default alone does not change existing routine parameters.
export async function migrateAuth(connection, backupDirectory = new URL('../logs/auth-migrations/', import.meta.url)) {
  return migrateParameters(connection, 'tai_khoan', {
    sp_auth_find_by_username: { p_ten_dang_nhap: 'ten_dang_nhap' },
    sp_auth_check_duplicate: { p_ten_dang_nhap: 'ten_dang_nhap', p_email: 'email' },
  }, backupDirectory);
}

export async function migrateParameters(connection, table, targets, backupDirectory) {
  const [columns] = await connection.query(`SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`, [table]);
  for (const [name, fields] of Object.entries(targets)) {
    const [parameters] = await connection.query(`SELECT PARAMETER_NAME, CHARACTER_SET_NAME, COLLATION_NAME
      FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA=DATABASE() AND SPECIFIC_NAME=?`, [name]);
    const changes = Object.entries(fields).map(([parameterName, field]) => {
      const column = columns.find(row => row.COLUMN_NAME === field);
      const parameter = parameters.find(row => row.PARAMETER_NAME === parameterName);
      if (!column || !parameter) throw new Error(`Missing column or parameter: ${name}.${parameterName}`);
      return { column, parameter };
    }).filter(({ column, parameter }) => column.CHARACTER_SET_NAME !== parameter.CHARACTER_SET_NAME || column.COLLATION_NAME !== parameter.COLLATION_NAME);
    if (!changes.length) continue;

    const [definition] = await connection.query(`SHOW CREATE PROCEDURE \`${name}\``);
    const original = definition[0]['Create Procedure'];
    let updated = original;
    for (const { column, parameter } of changes) {
      if (![column.CHARACTER_SET_NAME, column.COLLATION_NAME].every(value => /^[a-zA-Z0-9_]+$/.test(value))) throw new Error('Invalid charset metadata');
      const declaration = new RegExp(`(\\bIN\\s+\`?${parameter.PARAMETER_NAME}\`?\\s+VARCHAR\\s*\\(\\d+\\))(?:\\s+CHARACTER\\s+SET\\s+\\w+)?(?:\\s+COLLATE\\s+\\w+)?`, 'i');
      if (!declaration.test(updated)) throw new Error(`Unsupported parameter declaration: ${name}.${parameter.PARAMETER_NAME}`);
      updated = updated.replace(declaration, `$1 CHARACTER SET ${column.CHARACTER_SET_NAME} COLLATE ${column.COLLATION_NAME}`);
    }
    await mkdir(backupDirectory, { recursive: true });
    await writeFile(new URL(`${name}-${Date.now()}.sql`, backupDirectory), `${original};\n`, { flag: 'wx' });
    const [settings] = await connection.query('SELECT @@SESSION.sql_mode AS sql_mode');
    try {
      await connection.query('SET SESSION sql_mode=?', [definition[0].sql_mode]);
      await connection.query(`DROP PROCEDURE \`${name}\``);
      try { await connection.query(updated); }
      catch (error) { await connection.query(original); throw error; }
    } finally {
      await connection.query('SET SESSION sql_mode=?', [settings[0].sql_mode]);
    }
    console.log(`${name}: parameter collations aligned with ${table}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let connection;
  try { connection = await pool.getConnection(); await migrateAuth(connection); }
  finally { connection?.release(); await pool.end(); }
}
