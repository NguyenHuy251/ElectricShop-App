import { pathToFileURL } from 'node:url';
import { pool } from '../dist/config/database.js';
import { ensurePermissionSchema } from '../dist/services/permission.service.js';

export async function migratePermissions(db = pool) {
  await ensurePermissionSchema(db);
  console.log('Staff permission schema ready. Accounts without assigned permissions have no management access.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await migratePermissions(); } finally { await pool.end(); }
}
