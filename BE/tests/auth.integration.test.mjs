import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import express from 'express';

test('collation migration repairs login, catalog search and account lookups', { skip: process.env.AUTH_INTEGRATION !== '1' }, async () => {
  dotenv.config();
  const database = `electric_auth_test_${Date.now()}_${process.pid}`;
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '' });
  const backup = await mkdtemp(join(tmpdir(), 'electric-auth-'));
  let pool, server;
  try {
    await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${database}\``);
    const schema = await readFile(new URL('../database/database.sql', import.meta.url), 'utf8');
    const tableStart = schema.indexOf('CREATE TABLE tai_khoan (');
    const tables = schema.slice(tableStart, schema.indexOf('INSERT INTO tai_khoan')).replaceAll('DEFAULT CHARSET=utf8mb4', 'DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    for (const statement of tables.split(';').map(value => value.trim()).filter(Boolean)) await connection.query(statement);
    for (const name of ['sp_auth_find_by_username', 'sp_auth_check_duplicate', 'sp_auth_find_by_id', 'sp_san_pham_list', 'sp_san_pham_find_by_code', 'sp_tai_khoan_find_by_email']) {
      const start = schema.indexOf(`CREATE PROCEDURE ${name}(`);
      await connection.query(schema.slice(start, schema.indexOf('$$', start)));
    }
    await assert.rejects(connection.query("CALL sp_auth_find_by_username('admin_test')"), { code: 'ER_CANT_AGGREGATE_2COLLATIONS' });
    await assert.rejects(connection.query("CALL sp_san_pham_list('',NULL,NULL,NULL,NULL,10,0)"), { code: 'ER_CANT_AGGREGATE_2COLLATIONS' });
    process.env.DB_NAME = database;
    ({ pool } = await import('../dist/config/database.js'));
    const { ensurePermissionSchema } = await import('../dist/services/permission.service.js');
    await ensurePermissionSchema(pool);
    await ensurePermissionSchema(pool);
    const { migrateCollations } = await import('../scripts/migrate-collations.mjs');
    const backupUrl = pathToFileURL(backup + '/');
    await migrateCollations(connection, backupUrl);
    await migrateCollations(connection, backupUrl);
    await connection.query("INSERT INTO danh_muc (ma_danh_muc,ten_danh_muc) VALUES (1,'Nhà bếp')");
    await connection.query("INSERT INTO thuong_hieu (ma_thuong_hieu,ten_thuong_hieu) VALUES (1,'Test')");
    await connection.query("INSERT INTO san_pham (ma_san_pham,ma_danh_muc,ma_thuong_hieu,ma_san_pham_code,ten_san_pham,gia_ban,so_luong) VALUES (1,1,1,'TEST-001','Ấm điện',100000,5)");
    for (const [search, expected] of [['',1],['Ấm',1],['TEST-001',1],['Nhà bếp',1],['missing',0]]) {
      const [result] = await connection.query('CALL sp_san_pham_list(?,NULL,NULL,NULL,NULL,10,0)', [search]);
      assert.equal(result[0][0].total, expected); assert.equal(result[1].length, expected);
    }
    const [codes] = await connection.query('CALL sp_san_pham_find_by_code(?)', ['TEST-001']);
    assert.equal(codes[0][0].ma_san_pham, 1);
    await connection.query('ALTER TABLE tai_khoan ADD COLUMN token_version INT NOT NULL DEFAULT 0');
    await connection.query(`CREATE TABLE auth_sessions (
      token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      ma_tai_khoan INT NOT NULL, token_version INT NOT NULL, expires_at DATETIME NOT NULL,
      FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE)`);
    const password = 'Auth-test-password-2026';
    const hash = await bcrypt.hash(password, 10);
    for (const [username, role] of [['admin_test', 'Admin'], ['customer_test', 'KhachHang']]) {
      await connection.execute('INSERT INTO tai_khoan (ten_dang_nhap,mat_khau,ho_ten,email,vai_tro) VALUES (?,?,?,?,?)', [username, hash, username, `${username}@example.com`, role]);
    }
    const [duplicates] = await connection.query('CALL sp_auth_check_duplicate(?,?,?)', ['admin_test', 'unused@example.com', 0]);
    assert.equal(duplicates[0].length, 1);
    const [emailDuplicates] = await connection.query('CALL sp_auth_check_duplicate(?,?,?)', ['unused', 'customer_test@example.com', 0]);
    assert.equal(emailDuplicates[0].length, 1);
    const [emails] = await connection.query('CALL sp_tai_khoan_find_by_email(?,?)', ['customer_test@example.com',0]);
    assert.equal(emails[0].length, 1);
    const { default: authRoutes } = await import('../dist/routes/auth.routes.js');
    const { default: employeeRoutes } = await import('../dist/routes/nhanVien.routes.js');
    const { adminValidation } = await import('../dist/middleware/adminValidation.middleware.js');
    const app = express(); app.use(express.json()); app.use('/api', adminValidation); app.use('/api/auth', authRoutes);
    app.use('/api/nhan-vien', employeeRoutes);
    const { default: permissionRoutes } = await import('../dist/routes/permission.routes.js');
    const { authenticate } = await import('../dist/middleware/auth.middleware.js');
    const { authorizePermission } = await import('../dist/middleware/role.middleware.js');
    app.use('/api/permissions', permissionRoutes);
    const { forgotPassword } = await import('../dist/controllers/forgotPassword.controller.js');
    app.post('/api/test-reset', forgotPassword);
    for (const permission of ['catalog','orders','inventory','reviews','contacts','vouchers','reports','dashboard']) {
      for (const method of ['get','post','put','delete']) app[method](`/api/access/${permission}`, authenticate, authorizePermission(permission), (_req,res) => res.json({success:true}));
    }
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    const login = (username, mat_khau, mobile = false) => fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(mobile ? {'X-Client-Platform':'mobile'} : {}) }, body: JSON.stringify({ ten_dang_nhap: username, mat_khau }) });
    const tokens = {};
    for (const username of ['admin_test', 'customer_test']) {
      const response = await login(username, password);
      assert.equal(response.status, 200);
      const { data } = await response.json();
      tokens[username] = data.token;
      assert.ok(data.token); assert.ok(data.refresh_token); assert.equal(data.user.mat_khau, undefined);
      const me = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${data.token}` } });
      assert.equal(me.status, 200); assert.equal((await me.json()).data.ten_dang_nhap, username);
    }
    assert.equal((await login('admin_test', 'wrong-password')).status, 401);
    assert.equal((await login('missing_test', password)).status, 401);
    await connection.query("INSERT INTO nhan_vien (ma_nhan_vien,ho_ten,so_dien_thoai,trang_thai) VALUES (201,'Unlinked employee','0912345678','DangLam'),(202,'Second employee',NULL,'DangLam'),(203,'Rollback employee',NULL,'DangLam'),(204,'Former employee',NULL,'NghiLam')");
    const createAccount = (id, username, token = tokens.admin_test) => fetch(base.replace('/auth','/nhan-vien') + `/${id}/account`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ten_dang_nhap: username, email: `${username}@example.com`, mat_khau: password, vai_tro: 'Admin' }) });
    assert.equal((await createAccount(201,'staff_test',tokens.customer_test)).status,403);
    const created = await createAccount(201,'staff_test');
    assert.equal(created.status,200);
    const account = (await created.json()).data;
    assert.equal(account.vai_tro,'NhanVien'); assert.equal(account.mat_khau,undefined);
    const [linked] = await connection.query('SELECT t.* FROM nhan_vien n JOIN tai_khoan t USING(ma_tai_khoan) WHERE n.ma_nhan_vien=201');
    assert.equal(linked[0].ma_tai_khoan,account.ma_tai_khoan);
    assert.equal(linked[0].ho_ten,'Unlinked employee');
    assert.equal(linked[0].so_dien_thoai,'0912345678');
    assert.ok(await bcrypt.compare(password,linked[0].mat_khau));
    const staffLogin = await login('staff_test',password);
    assert.equal(staffLogin.status,200);
    const staffData = (await staffLogin.json()).data;
    const [beforeMobile] = await connection.query('SELECT COUNT(*) AS total FROM auth_sessions');
    const blockedLogin = await login('staff_test',password,true);
    assert.equal(blockedLogin.status,403);
    assert.equal((await blockedLogin.json()).code,'MOBILE_STAFF_FORBIDDEN');
    const [afterMobile] = await connection.query('SELECT COUNT(*) AS total FROM auth_sessions');
    assert.equal(afterMobile[0].total,beforeMobile[0].total);
    const blockedMe = await fetch(`${base}/me`,{headers:{Authorization:`Bearer ${staffData.token}`,'X-Client-Platform':'mobile'}});
    assert.equal(blockedMe.status,403);
    assert.equal((await blockedMe.json()).code,'MOBILE_STAFF_FORBIDDEN');
    const blockedRefresh = await fetch(`${base}/refresh`,{method:'POST',headers:{'Content-Type':'application/json','X-Client-Platform':'mobile'},body:JSON.stringify({refresh_token:staffData.refresh_token})});
    assert.equal(blockedRefresh.status,403);
    assert.equal((await blockedRefresh.json()).code,'MOBILE_STAFF_FORBIDDEN');
    const webRefresh = await fetch(`${base}/refresh`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:staffData.refresh_token})});
    assert.equal(webRefresh.status,200);
    assert.equal((await login('customer_test',password,true)).status,200);
    assert.equal((await login('admin_test',password,true)).status,200);
    assert.deepEqual(staffData.user.permissions,[]);
    const access = (permission, token = staffData.token, method = 'GET') => fetch(base.replace('/auth','/access/') + permission, {method, headers:{Authorization:`Bearer ${token}`}});
    const savePermissions = (permissions, token = tokens.admin_test, id = account.ma_tai_khoan) => fetch(base.replace('/auth','/permissions/')+id,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({permissions})});
    assert.equal((await access('orders')).status,403);
    assert.equal((await savePermissions(['orders'],staffData.token)).status,403);
    assert.equal((await savePermissions(['orders'],tokens.customer_test)).status,403);
    assert.equal((await savePermissions(['unknown'])).status,400);
    assert.equal((await savePermissions(['orders','orders'])).status,400);
    assert.equal((await savePermissions(['orders'],tokens.admin_test,1)).status,400);
    assert.equal((await savePermissions(['orders'],tokens.admin_test,99999)).status,404);
    assert.equal((await savePermissions(['orders','contacts'])).status,200);
    for (const permission of ['catalog','orders','inventory','reviews','contacts','vouchers','reports','dashboard']) {
      for (const method of ['GET','POST','PUT','DELETE']) {
        assert.equal((await access(permission,staffData.token,method)).status,['orders','contacts'].includes(permission)?200:403);
        assert.equal((await access(permission,tokens.admin_test,method)).status,200);
        assert.equal((await access(permission,tokens.customer_test,method)).status,403);
      }
    }
    const staffMe = await fetch(`${base}/me`,{headers:{Authorization:`Bearer ${staffData.token}`}});
    assert.deepEqual((await staffMe.json()).data.permissions,['orders','contacts']);
    assert.equal((await savePermissions([])).status,200);
    assert.equal((await access('orders',staffData.token,'DELETE')).status,403);
    const catalog = await fetch(base.replace('/auth','/permissions'),{headers:{Authorization:`Bearer ${tokens.admin_test}`}});
    assert.equal(catalog.status,200);
    const config = (await catalog.json()).data;
    assert.equal(config.groups.length,8);
    assert.deepEqual(config.accounts.find(row=>row.ma_tai_khoan===account.ma_tai_khoan).permissions,[]);
    assert.equal((await createAccount(201,'staff_duplicate')).status,409);
    assert.equal((await createAccount(202,'staff_test')).status,409);
    const concurrent = await Promise.all([createAccount(202,'staff_race_a'),createAccount(202,'staff_race_b')]);
    assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
    const [raceAccounts] = await connection.query("SELECT ma_tai_khoan FROM tai_khoan WHERE ten_dang_nhap IN ('staff_race_a','staff_race_b')");
    assert.equal(raceAccounts.length,1);
    await connection.query("CREATE TRIGGER fail_employee_link BEFORE UPDATE ON nhan_vien FOR EACH ROW BEGIN IF NEW.ma_nhan_vien=203 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected failure'; END IF; END");
    assert.equal((await createAccount(203,'staff_rollback')).status,503);
    const [rolledBack] = await connection.query("SELECT ma_tai_khoan FROM tai_khoan WHERE ten_dang_nhap='staff_rollback'");
    assert.equal(rolledBack.length,0);
    const former = await createAccount(204,'former_staff');
    assert.equal(former.status,200); assert.equal((await former.json()).data.trang_thai,'Khoa');
    assert.equal((await login('former_staff',password)).status,403);
    // Password recovery runs only in this isolated database; production accounts are untouched.
    await connection.query("UPDATE tai_khoan SET so_dien_thoai='0912345678' WHERE ten_dang_nhap='customer_test'");
    const [customerRows] = await connection.query("SELECT ma_tai_khoan,mat_khau,token_version FROM tai_khoan WHERE ten_dang_nhap='customer_test'");
    const customer = customerRows[0];
    const recover = (email, phone, path = `${base}/forgot-password`) => fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Client-Platform':'mobile'},body:JSON.stringify({email,so_dien_thoai:phone,mat_khau:'attacker-chosen-password'})});
    assert.equal((await recover('bad-email','0912345678')).status,400);
    assert.equal((await recover('customer_test@example.com','0987654321')).status,400);
    assert.equal((await recover('missing@example.com','0912345678')).status,400);
    assert.equal((await recover('staff_test@example.com','0912345678')).status,400);
    const [unchanged] = await connection.query('SELECT mat_khau,token_version FROM tai_khoan WHERE ma_tai_khoan=?',[customer.ma_tai_khoan]);
    assert.equal(unchanged[0].mat_khau,customer.mat_khau); assert.equal(unchanged[0].token_version,customer.token_version);
    const recovered = await recover(' CUSTOMER_TEST@example.com ','+84 912 345 678');
    assert.equal(recovered.status,200);
    assert.equal(recovered.headers.get('cache-control'),'no-store');
    const recoveredData = (await recovered.json()).data;
    assert.deepEqual(recoveredData,{new_password:'12345678'});
    const [updated] = await connection.query('SELECT mat_khau,token_version FROM tai_khoan WHERE ma_tai_khoan=?',[customer.ma_tai_khoan]);
    assert.ok(await bcrypt.compare('12345678',updated[0].mat_khau));
    assert.equal(updated[0].token_version,customer.token_version+1);
    assert.equal((await fetch(`${base}/me`,{headers:{Authorization:`Bearer ${tokens.customer_test}`}})).status,401);
    const [remainingSessions] = await connection.query('SELECT COUNT(*) AS total FROM auth_sessions WHERE ma_tai_khoan=?',[customer.ma_tai_khoan]);
    assert.equal(remainingSessions[0].total,0);
    assert.equal((await login('customer_test',password)).status,401);
    const resetLogin = await login('customer_test','12345678',true);
    assert.equal(resetLogin.status,200);
    const resetToken = (await resetLogin.json()).data.token;
    assert.equal((await recover('customer_test@example.com','0912345678')).status,429);
    const directReset = base.replace('/auth','/test-reset');
    assert.equal((await recover('admin_test@example.com','0912345678',directReset)).status,400);
    await connection.query(`CREATE TRIGGER fail_session_revocation BEFORE DELETE ON auth_sessions FOR EACH ROW BEGIN IF OLD.ma_tai_khoan=${customer.ma_tai_khoan} THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected reset failure'; END IF; END`);
    assert.equal((await recover('customer_test@example.com','0912345678',directReset)).status,503);
    const [rolledReset] = await connection.query('SELECT mat_khau,token_version FROM tai_khoan WHERE ma_tai_khoan=?',[customer.ma_tai_khoan]);
    assert.deepEqual(rolledReset[0],updated[0]);
    assert.equal((await fetch(`${base}/me`,{headers:{Authorization:`Bearer ${resetToken}`,'X-Client-Platform':'mobile'}})).status,200);
    await connection.query('DROP TRIGGER fail_session_revocation');
    await connection.query("UPDATE tai_khoan SET trang_thai='Khoa' WHERE ma_tai_khoan=?",[customer.ma_tai_khoan]);
    assert.equal((await recover('customer_test@example.com','0912345678',directReset)).status,400);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.end();
    await rm(backup, { recursive: true, force: true });
  }
});
