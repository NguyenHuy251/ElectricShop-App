import { readFile } from 'node:fs/promises';
import { pool } from '../dist/config/database.js';

export async function migrateLocal() {
  const sql = await readFile(new URL('../migrations/009_local_shop.sql', import.meta.url), 'utf8');
  const connection = await pool.getConnection();
  try {
    for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await connection.query(statement);
    const [columns] = await connection.query('SHOW COLUMNS FROM don_hang');
    const fields = new Set(columns.map(row => row.Field));
    const [accounts]=await connection.query('SHOW COLUMNS FROM tai_khoan');
    if(!accounts.some(row=>row.Field==='token_version'))await connection.query('ALTER TABLE tai_khoan ADD COLUMN token_version INT NOT NULL DEFAULT 0');
    for (const [name, type] of [['ma_voucher', 'INT NULL'], ['ma_code', 'VARCHAR(40) NULL'], ['giam_gia', 'DECIMAL(15,2) NOT NULL DEFAULT 0'], ['phi_giao_hang', 'DECIMAL(15,2) NOT NULL DEFAULT 0']]) {
      if (!fields.has(name)) await connection.query(`ALTER TABLE don_hang ADD COLUMN ${name} ${type}`);
    }
    const [voucherColumns] = await connection.query('SHOW COLUMNS FROM voucher');
    // Read historical codes separately: existing order triggers may update voucher_su_dung.
    const [historicalCodes] = await connection.query(voucherColumns.some(row => row.Field === 'code')
      ? "SELECT d.ma_don_hang,u.code AS ma_code FROM don_hang d JOIN voucher_su_dung u ON u.ma_don_hang=d.ma_don_hang WHERE d.ma_code IS NULL AND d.ma_voucher IS NOT NULL"
      : "SELECT d.ma_don_hang,v.ma_code FROM don_hang d JOIN voucher v ON v.ma_voucher=d.ma_voucher WHERE d.ma_code IS NULL");
    for (const row of historicalCodes) await connection.execute('UPDATE don_hang SET ma_code=? WHERE ma_don_hang=? AND ma_code IS NULL', [row.ma_code,row.ma_don_hang]);
    const [notificationColumns]=await connection.query('SHOW COLUMNS FROM thong_bao');
    if(!notificationColumns.some(row=>row.Field==='tieu_de'))await connection.query("ALTER TABLE thong_bao ADD COLUMN tieu_de VARCHAR(150) NOT NULL DEFAULT 'Notification'");
    console.log('009_local_shop applied.');
    const triggers={
      order_created_notification: `CREATE TRIGGER order_created_notification AFTER INSERT ON don_hang FOR EACH ROW INSERT INTO thong_bao (ma_tai_khoan,tieu_de,noi_dung,ma_don_hang) VALUES (NEW.ma_tai_khoan,'Đơn hàng mới',CONCAT('Đơn #',NEW.ma_don_hang,' đã được ghi nhận.'),NEW.ma_don_hang)`,
      order_status_notification: `CREATE TRIGGER order_status_notification AFTER UPDATE ON don_hang FOR EACH ROW BEGIN IF OLD.trang_thai <> NEW.trang_thai THEN INSERT INTO thong_bao (ma_tai_khoan,tieu_de,noi_dung,ma_don_hang) VALUES (NEW.ma_tai_khoan,'Order update',CONCAT('Đơn #',NEW.ma_don_hang,': ', CASE NEW.trang_thai WHEN 'DaXacNhan' THEN 'Đã xác nhận' WHEN 'DangGiao' THEN 'Đang giao' WHEN 'DaGiao' THEN 'Đã giao' WHEN 'DaHuy' THEN 'Đã hủy' ELSE 'Chờ xác nhận' END),NEW.ma_don_hang); END IF; END`,
    };
    const [contactColumns]=await connection.query('SHOW COLUMNS FROM lien_he');
    if(contactColumns.some(row=>row.Field==='phan_hoi'))triggers.contact_reply_notification=`CREATE TRIGGER contact_reply_notification AFTER UPDATE ON lien_he FOR EACH ROW BEGIN IF NEW.phan_hoi IS NOT NULL AND NOT (OLD.phan_hoi <=> NEW.phan_hoi) AND NEW.ma_tai_khoan IS NOT NULL THEN INSERT INTO thong_bao (ma_tai_khoan,tieu_de,noi_dung) VALUES (NEW.ma_tai_khoan,'Contact reply',CONCAT('Cửa hàng đã phản hồi liên hệ: ',NEW.tieu_de)); END IF; END`;
    for(const [name,sql] of Object.entries(triggers)) {
      const [existing]=await connection.query('SELECT TRIGGER_NAME,ACTION_STATEMENT FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?',[name]);
      if(!existing.length)await connection.query(sql);
      else if(/INSERT INTO thong_bao\s*\(ma_tai_khoan,\s*noi_dung/i.test(existing[0].ACTION_STATEMENT)) {
        const [original]=await connection.query('SHOW CREATE TRIGGER '+name);
        const rollback=original[0]['SQL Original Statement'];
        await connection.query('DROP TRIGGER '+name);
        try {await connection.query(sql);} catch(error) {await connection.query(rollback);throw error;}
      }
    }
  } finally { connection.release(); }
}
if (process.argv[1]?.endsWith('migrate-local.mjs')) {
  try { await migrateLocal(); } finally { await pool.end(); }
}
