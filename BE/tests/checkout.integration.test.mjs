import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

test('checkout transactions against an isolated MySQL database', { skip: process.env.CHECKOUT_INTEGRATION !== '1' }, async t => {
  dotenv.config();
  const database = `electric_checkout_test_${Date.now()}_${process.pid}`;
  const admin = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  let pool;
  try {
    await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`);
    await admin.query(`USE \`${database}\``);
    const schema = await readFile(new URL('../database.sql', import.meta.url), 'utf8');
    await admin.query(schema.slice(schema.indexOf('CREATE TABLE tai_khoan'), schema.indexOf('INSERT INTO tai_khoan')));
    process.env.DB_NAME = database;
    ({ pool } = await import('../dist/config/database.js'));
    const { createDonHang, previewCheckout } = await import('../dist/controllers/checkout.controller.js');
    const { cancelDonHang, getDonHangById } = await import('../dist/controllers/donHang.controller.js');
    const { addToCart, updateCartItem } = await import('../dist/controllers/gioHang.controller.js');
    const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
    const user = id => ({ ma_tai_khoan: id, vai_tro: 'KhachHang' });
    const invoke = async (fn, req) => { const res = response(); await fn(req, res); return res; };
    await admin.query("INSERT INTO tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau, ho_ten) VALUES (1, 'test1', 'unused', 'Test One'), (2, 'test2', 'unused', 'Test Two'); INSERT INTO danh_muc (ma_danh_muc, ten_danh_muc) VALUES (1, 'Test'); INSERT INTO thuong_hieu (ma_thuong_hieu, ten_thuong_hieu) VALUES (1, 'Test'); INSERT INTO san_pham (ma_san_pham, ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, gia_ban, so_luong) VALUES (1, 1, 1, 'TEST', 'Test product', 100000, 10); INSERT INTO gio_hang (ma_gio_hang, ma_tai_khoan) VALUES (1, 1), (2, 2)");
    const reset = async () => admin.query("DELETE FROM checkout_requests; DELETE FROM chi_tiet_don_hang; DELETE FROM don_hang; DELETE FROM chi_tiet_gio_hang; UPDATE san_pham SET so_luong = 10, gia_ban = 100000, trang_thai = 'DangBan'; INSERT INTO chi_tiet_gio_hang VALUES (1, 1, 2)");
    const payload = async (id = 1, key = 'checkout_integration_123456') => ({ ho_ten_nguoi_nhan: 'Test Customer', so_dien_thoai: '0912345678', dia_chi_giao_hang: '12 Nguyen Trai, Ha Noi', ghi_chu: 'Test', phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang', request_id: key, snapshot: (await invoke(previewCheckout, { user: user(id) })).body.data.snapshot });
    const count = async table => Number((await admin.query(`SELECT COUNT(*) AS n FROM ${table}`))[0][0].n);
    const stock = async () => Number((await admin.query('SELECT so_luong FROM san_pham WHERE ma_san_pham = 1'))[0][0].so_luong);

    await t.test('successful COD stores generated totals, clears cart, ignores client total', async () => {
      await reset();
      const res = await invoke(createDonHang, { user: user(1), body: { ...await payload(), tong_tien: 1 } });
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.tong_tien, 200000);
      assert.equal(res.body.data.trang_thai, 'ChoXacNhan');
      assert.equal(await stock(), 8);
      assert.equal(await count('chi_tiet_gio_hang'), 0);
      const [lines] = await admin.query('SELECT thanh_tien FROM chi_tiet_don_hang');
      assert.equal(Number(lines[0].thanh_tien), 200000);
      const forbidden = await invoke(getDonHangById, { user: user(2), params: { id: String(res.body.data.ma_don_hang) } });
      assert.equal(forbidden.statusCode, 403);
    });
    await t.test('concurrent retries create one order and deduct stock once', async () => {
      await reset(); const body = await payload();
      const results = await Promise.all([1, 2, 3].map(() => invoke(createDonHang, { user: user(1), body })));
      assert.deepEqual(results.map(r => r.statusCode), [200, 200, 200]);
      assert.equal(new Set(results.map(r => r.body.data.ma_don_hang)).size, 1);
      assert.equal(await count('don_hang'), 1); assert.equal(await stock(), 8);
      assert.equal((await invoke(createDonHang, { user: user(1), body: { ...body, ghi_chu: 'changed' } })).statusCode, 409);
    });
    await t.test('different request keys cannot double-checkout the same cart', async () => {
      await reset(); const body = await payload();
      const results = await Promise.all(['first', 'second'].map(key => invoke(createDonHang, { user: user(1), body: { ...body, request_id: `checkout_parallel_${key}` } })));
      assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]);
      assert.equal(await count('don_hang'), 1); assert.equal(await stock(), 8);
    });
    await t.test('price changes, stopped products, invalid quantities and insufficient stock are rejected', async () => {
      for (const sql of ["UPDATE san_pham SET gia_ban = 120000", "UPDATE san_pham SET trang_thai = 'NgungBan'", 'UPDATE san_pham SET so_luong = 1', 'UPDATE chi_tiet_gio_hang SET so_luong = -1', 'UPDATE chi_tiet_gio_hang SET so_luong = 3']) {
        await reset(); const body = await payload(); await admin.query(sql);
        const res = await invoke(createDonHang, { user: user(1), body });
        assert.equal(res.statusCode, 409, JSON.stringify(res.body));
        assert.equal(await count('don_hang'), 0); assert.equal(await count('chi_tiet_gio_hang'), 1);
      }
    });
    await t.test('cart edit concurrent with checkout cannot silently change the ordered quantity', async () => {
      await reset(); const body = await payload();
      const [order, edit] = await Promise.all([
        invoke(createDonHang, { user: user(1), body }),
        invoke(updateCartItem, { user: user(1), params: { ma_san_pham: '1' }, body: { so_luong: 3 } }),
      ]);
      if (order.statusCode === 200) {
        assert.equal(edit.statusCode, 404); assert.equal(await stock(), 8); assert.equal(await count('chi_tiet_gio_hang'), 0);
      } else {
        assert.equal(order.statusCode, 409); assert.equal(edit.statusCode, 200); assert.equal(await stock(), 10); assert.equal(await count('don_hang'), 0);
      }
    });
    await t.test('two customers competing for last item cannot oversell', async () => {
      await reset(); await admin.query('UPDATE san_pham SET so_luong = 1; UPDATE chi_tiet_gio_hang SET so_luong = 1; INSERT INTO chi_tiet_gio_hang VALUES (2, 1, 1)');
      const bodies = await Promise.all([payload(1), payload(2)]);
      const results = await Promise.all(bodies.map((body, i) => invoke(createDonHang, { user: user(i + 1), body })));
      assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]);
      assert.equal(await stock(), 0); assert.equal(await count('don_hang'), 1); assert.equal(await count('chi_tiet_gio_hang'), 1);
    });
    await t.test('database failure rolls back order, inventory and cart atomically', async () => {
      await reset(); const body = await payload();
      await admin.query("CREATE TRIGGER fail_checkout BEFORE INSERT ON chi_tiet_don_hang FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Injected integration failure'");
      try {
        assert.equal((await invoke(createDonHang, { user: user(1), body })).statusCode, 503);
        assert.equal(await count('don_hang'), 0); assert.equal(await stock(), 10); assert.equal(await count('chi_tiet_gio_hang'), 1); assert.equal(await count('checkout_requests'), 0);
      } finally { await admin.query('DROP TRIGGER fail_checkout'); }
    });
    await t.test('cart validates quantities and stock, cancellation restores inventory exactly once', async () => {
      await reset();
      for (const quantity of [-1, 0, 1.5, '2', 1000]) assert.equal((await invoke(updateCartItem, { user: user(1), params: { ma_san_pham: '1' }, body: { so_luong: quantity } })).statusCode, 400);
      assert.equal((await invoke(addToCart, { user: user(1), body: { ma_san_pham: 1, so_luong: 10 } })).statusCode, 409);
      const order = await invoke(createDonHang, { user: user(1), body: await payload() });
      const req = { user: user(1), params: { id: order.body.data.ma_don_hang } };
      assert.equal((await invoke(cancelDonHang, req)).statusCode, 200);
      assert.equal((await invoke(cancelDonHang, req)).statusCode, 400);
      assert.equal(await stock(), 10);
    });
  } finally {
    if (pool) await pool.end();
    // Only the uniquely named database created by this test can be dropped.
    assert.match(database, /^electric_checkout_test_\d+_\d+$/);
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.end();
  }
});
