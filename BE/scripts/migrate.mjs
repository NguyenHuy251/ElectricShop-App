import { readFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';
try {
  await pool.query(await readFile(new URL('../migrations/001_checkout.sql', import.meta.url), 'utf8'));
  console.log('Checkout migration applied. Existing data preserved.');
} finally { await pool.end(); }
