// Run with Expo web on localhost:8081. Uses a disposable database, never shop orders.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();
const require = createRequire(new URL('../../FE/admin/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const database = `electric_checkout_web_${Date.now()}_${process.pid}`;
const api = 'http://127.0.0.1:3101/api';
const admin = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
let server, browser, page;
const count = async table => Number((await admin.query(`SELECT COUNT(*) AS n FROM ${table}`))[0][0].n);
try {
  await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4; USE \`${database}\``);
  const schema = await readFile(new URL('../database.sql', import.meta.url), 'utf8');
  await admin.query(schema.slice(schema.indexOf('CREATE TABLE tai_khoan'), schema.indexOf('INSERT INTO tai_khoan')));
  await admin.query("INSERT INTO danh_muc (ma_danh_muc, ten_danh_muc) VALUES (1, 'Nhà bếp'); INSERT INTO thuong_hieu (ma_thuong_hieu, ten_thuong_hieu) VALUES (1, 'Electric'); INSERT INTO san_pham (ma_san_pham, ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, gia_ban, so_luong) VALUES (1, 1, 1, 'TEST', 'Ấm siêu tốc Electric 1.8L', 350000, 10)");
  server = spawn(process.execPath, ['dist/app.js'], { cwd: fileURLToPath(new URL('../', import.meta.url)), env: { ...process.env, DB_NAME: database, PORT: '3101', JWT_SECRET: randomUUID() }, windowsHide: true, stdio: 'pipe' });
  let serverLog = '';
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try { ready = (await fetch(`${api}/health`)).ok; if (ready) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'test backend did not start');
  const registration = await fetch(`${api}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ten_dang_nhap: 'checkout_web', mat_khau: 'CheckoutTest123!', ho_ten: 'Nguyễn An', email: 'checkout@example.test' }) });
  const registered = await registration.json(); assert.ok(registered.success, JSON.stringify(registered));
  const headers = { Authorization: `Bearer ${registered.data.token}`, 'Content-Type': 'application/json' };
  const add = async () => { const r = await fetch(`${api}/gio-hang`, { method: 'POST', headers, body: JSON.stringify({ ma_san_pham: 1, so_luong: 2 }) }); assert.equal(r.status, 200); };
  await add();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.log('Browser error:', error.message); });
  page.on('console', message => { if (message.type() === 'error') console.log('Browser console:', message.text()); });
  let loseNextOrderResponse = false;
  await page.route('**/api/**', async route => {
    const original = new URL(route.request().url());
    const response = await route.fetch({ url: `http://127.0.0.1:3101${original.pathname}${original.search}` });
    if (response.status() >= 400) console.log('API test response', original.pathname, response.status(), await response.text());
    if (loseNextOrderResponse && route.request().method() === 'POST' && original.pathname === '/api/don-hang') {
      loseNextOrderResponse = false;
      await route.abort('failed');
    } else await route.fulfill({ response });
  });
  await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Tên đăng nhập', { exact: true }).fill('checkout_web');
  await page.getByPlaceholder('Mật khẩu', { exact: true }).fill('CheckoutTest123!');
  await page.getByText('Đăng nhập', { exact: true }).click();
  await page.waitForURL('http://localhost:8081/', { waitUntil: 'domcontentloaded' }).catch(async error => { console.log('Login diagnostic:', page.url(), (await page.locator('body').innerText()).slice(-1500)); throw error; });
  await page.goto('http://localhost:8081/cart', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tiến hành thanh toán', exact: true }).click();
  await page.getByRole('button', { name: 'Kiểm tra đơn hàng', exact: true }).click();
  await page.getByText('Nhập số điện thoại di động Việt Nam hợp lệ.', { exact: true }).waitFor();
  await page.getByLabel('Số điện thoại *', { exact: true }).fill('0912345678');
  await page.getByLabel('Địa chỉ nhận hàng *', { exact: true }).fill('12 Nguyễn Trãi, phường Bến Thành, TP Hồ Chí Minh');
  await page.getByLabel('Ghi chú (không bắt buộc)', { exact: true }).fill('Gọi trước khi giao hàng.');
  const artifacts = fileURLToPath(new URL('../artifacts/checkout/', import.meta.url));
  await mkdir(artifacts, { recursive: true });
  await page.getByText('HOÀN TẤT ĐƠN HÀNG', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${artifacts}/desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('HOÀN TẤT ĐƠN HÀNG', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${artifacts}/mobile.png`, fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile overflow');
  await page.getByRole('button', { name: 'Kiểm tra đơn hàng', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Xác nhận đặt hàng COD' }).isDisabled(), true);
  await page.getByRole('checkbox').click();
  await page.screenshot({ path: `${artifacts}/mobile-confirmation.png`, fullPage: true });
  await page.getByRole('button', { name: 'Xác nhận đặt hàng COD' }).click();
  await page.waitForURL('**/checkout-success?orderId=*');
  await page.getByText('Đã ghi nhận đơn hàng!', { exact: true }).waitFor();
  assert.equal(await count('don_hang'), 1); assert.equal(await count('chi_tiet_gio_hang'), 0);
  await page.getByRole('button', { name: 'Xem chi tiết đơn hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy đơn hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận hủy đơn', exact: true }).click();
  await page.getByText('Đã hủy', { exact: true }).waitFor();
  assert.equal(Number((await admin.query('SELECT so_luong FROM san_pham'))[0][0].so_luong), 10);
  console.log('PASS: login, cart, recipient validation, COD confirmation, order details, cancellation, responsive layout');

  await add();
  await page.goto('http://localhost:8081/checkout', { waitUntil: 'networkidle' });
  await page.getByLabel('Số điện thoại *', { exact: true }).fill('0912345678');
  await page.getByLabel('Địa chỉ nhận hàng *', { exact: true }).fill('12 Nguyễn Trãi, phường Bến Thành, TP Hồ Chí Minh');
  await page.getByRole('button', { name: 'Kiểm tra đơn hàng', exact: true }).click();
  await page.getByRole('checkbox').click();
  loseNextOrderResponse = true;
  await page.getByRole('button', { name: 'Xác nhận đặt hàng COD' }).click();
  await page.getByRole('button', { name: 'Kiểm tra lại đơn', exact: true }).waitFor();
  assert.equal(await count('don_hang'), 2);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Kiểm tra lại đơn', exact: true }).click();
  await page.waitForURL('**/checkout-success?orderId=*');
  await page.getByText('Đã ghi nhận đơn hàng!', { exact: true }).waitFor();
  assert.equal(await count('don_hang'), 2, 'retry created duplicate order');
  assert.equal(Number((await admin.query('SELECT so_luong FROM san_pham'))[0][0].so_luong), 8);
  assert.deepEqual(errors, []);
  console.log('PASS: lost response after commit, browser reload, same-request recovery without duplicate order');
  await add();
  await page.goto('http://localhost:8081/checkout', { waitUntil: 'networkidle' });
  await page.getByLabel('Số điện thoại *', { exact: true }).fill('0912345678');
  await page.getByLabel('Địa chỉ nhận hàng *', { exact: true }).fill('12 Nguyễn Trãi, phường Bến Thành, TP Hồ Chí Minh');
  await page.getByRole('button', { name: 'Kiểm tra đơn hàng', exact: true }).click();
  await page.getByRole('checkbox').click();
  await admin.query('UPDATE san_pham SET gia_ban = 400000');
  await page.getByRole('button', { name: 'Xác nhận đặt hàng COD' }).click();
  await page.getByText('Giá hoặc giỏ hàng đã thay đổi. Vui lòng cập nhật và kiểm tra lại trước khi đặt hàng.', { exact: true }).waitFor();
  await page.getByLabel('Họ tên người nhận *', { exact: true }).waitFor();
  assert.equal(await count('don_hang'), 2);
  assert.equal(await page.getByRole('button', { name: 'Xác nhận đặt hàng COD' }).count(), 0);
  console.log('PASS: changed price rejected and requires customer review again');
  console.log(`Screenshots: ${artifacts}`);
} catch (error) {
  if (page) console.log('UI diagnostic:', page.url(), (await page.locator('body').innerText()).slice(-2500));
  throw error;
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill(); await new Promise(resolve => server.once('exit', resolve)); }
  assert.match(database, /^electric_checkout_web_\d+_\d+$/);
  await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await admin.end();
}
