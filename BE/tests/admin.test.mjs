import test from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../dist/config/database.js';
import { signToken } from '../dist/utils/jwt.js';
import { authenticate } from '../dist/middleware/auth.middleware.js';
import { authorize } from '../dist/middleware/role.middleware.js';
import { adminValidation } from '../dist/middleware/adminValidation.middleware.js';
import { updateTrangThaiDonHang, deleteDonHang } from '../dist/controllers/donHang.controller.js';
import { deleteTaiKhoan, updateTaiKhoan } from '../dist/controllers/taiKhoan.controller.js';
import { deleteDanhGia, getAllDanhGia } from '../dist/controllers/danhGia.controller.js';
import { getAllSanPham, deleteSanPham } from '../dist/controllers/sanPham.controller.js';
import { createNhanVien } from '../dist/controllers/nhanVien.controller.js';

function response() { return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
const originalQuery = pool.query;
const originalExecute = pool.execute;
const originalConnection = pool.getConnection;
test.afterEach(() => { pool.query = originalQuery; pool.execute = originalExecute; pool.getConnection = originalConnection; });
test.after(async () => { await pool.end(); });

test('authentication rejects invalid token and locked account, refreshes role from database', async () => {
  let next = false;
  const invalid = response(); await authenticate({ headers: { authorization: 'Bearer invalid' } }, invalid, () => { next = true; });
  assert.equal(invalid.statusCode, 401); assert.equal(next, false);
  const token = signToken({ ma_tai_khoan: 1, ten_dang_nhap: 'test', vai_tro: 'Admin' });
  pool.query = async () => [[{ ma_tai_khoan: 1, ten_dang_nhap: 'test', vai_tro: 'NhanVien', trang_thai: 'Khoa' }]];
  const locked = response(); await authenticate({ headers: { authorization: `Bearer ${token}` } }, locked, () => { next = true; });
  assert.equal(locked.statusCode, 401); assert.equal(next, false);
  pool.query = async () => [[{ ma_tai_khoan: 1, ten_dang_nhap: 'test', vai_tro: 'NhanVien', trang_thai: 'HoatDong' }]];
  const req = { headers: { authorization: `Bearer ${token}` } };
  await authenticate(req, response(), () => { next = true; });
  assert.equal(next, true); assert.equal(req.user.vai_tro, 'NhanVien');
  const forbidden = response(); authorize('Admin')(req, forbidden, () => assert.fail('Staff reached admin action'));
  assert.equal(forbidden.statusCode, 403);
});

test('admin cannot delete or lock their own account', async () => {
  pool.query = () => assert.fail('Must reject before database mutation');
  const req = { params: { id: '1' }, user: { ma_tai_khoan: 1 }, body: { trang_thai: 'Khoa' } };
  const deleted = response(); await deleteTaiKhoan(req, deleted); assert.equal(deleted.statusCode, 400);
  const locked = response(); await updateTaiKhoan(req, locked); assert.equal(locked.statusCode, 400);
});

function orderConnection(initial) {
  const state = { status: initial, stock: 5, commits: 0, rollbacks: 0, released: 0 };
  pool.getConnection = async () => ({
    beginTransaction: async () => {}, commit: async () => { state.commits++; }, rollback: async () => { state.rollbacks++; }, release: () => { state.released++; },
    query: async sql => sql.includes('chi_tiet_don_hang') ? [[{ ma_san_pham: 7, so_luong: 2 }]] : [[{ trang_thai: state.status }]],
    execute: async (sql, args) => { if (sql.includes('UPDATE san_pham')) state.stock += args[0]; else state.status = args[0]; return [{ affectedRows: 1 }]; },
  });
  return state;
}
test('order workflow rejects skips and terminal transitions', async () => {
  for (const [from, to] of [['ChoXacNhan', 'DaGiao'], ['DaGiao', 'DaHuy'], ['DaHuy', 'DaXacNhan'], ['DangGiao', 'invalid']]) {
    const state = orderConnection(from); const res = response();
    await updateTrangThaiDonHang({ params: { id: '1' }, body: { trang_thai: to } }, res);
    assert.equal(res.statusCode, 409); assert.equal(state.stock, 5); assert.equal(state.commits, 0); assert.equal(state.rollbacks, 1); assert.equal(state.released, 1);
  }
});
test('cancellation restores inventory once and commits atomically', async () => {
  const state = orderConnection('DaXacNhan'); const request = { params: { id: '1' }, body: { trang_thai: 'DaHuy' } };
  const first = response(); await updateTrangThaiDonHang(request, first);
  assert.equal(first.statusCode, 200); assert.equal(state.stock, 7); assert.equal(state.commits, 1);
  const second = response(); await updateTrangThaiDonHang(request, second);
  assert.equal(second.statusCode, 409); assert.equal(state.stock, 7);
});
test('sequential confirmation and delivery work without restoring stock', async () => {
  const state = orderConnection('ChoXacNhan');
  for (const status of ['DaXacNhan', 'DangGiao', 'DaGiao']) {
    const res = response(); await updateTrangThaiDonHang({ params: { id: '1' }, body: { trang_thai: status } }, res); assert.equal(res.statusCode, 200);
  }
  assert.equal(state.stock, 5); assert.equal(state.status, 'DaGiao'); assert.equal(state.commits, 3);
});
test('active orders cannot be deleted', async () => {
  pool.query = async () => [[{ trang_thai: 'DangGiao' }]]; pool.execute = () => assert.fail('Deleted active order');
  const res = response(); await deleteDonHang({ params: { id: '1' } }, res); assert.equal(res.statusCode, 409);
});
test('staff can moderate reviews but customer deletion is scoped to owner', async () => {
  const queries = []; pool.query = async (sql, args) => { queries.push({ sql, args }); return [[{ ma_danh_gia: 5 }]]; }; pool.execute = async () => [{ affectedRows: 1 }];
  for (const vai_tro of ['Admin', 'NhanVien', 'KhachHang']) {
    const res = response(); await deleteDanhGia({ params: { id: '5' }, user: { vai_tro, ma_tai_khoan: 4 } }, res); assert.equal(res.statusCode, 200);
  }
  assert.equal(queries[0].args.length, 1); assert.equal(queries[1].args.length, 1); assert.match(queries[2].sql, /AND ma_tai_khoan/); assert.deepEqual(queries[2].args, ['5', 4]);
});
test('review filters and pagination are passed to SQL', async () => {
  const queries = []; pool.query = async (sql, args) => { queries.push({ sql, args }); return [sql.includes('COUNT') ? [{ total: 21 }] : []]; };
  const res = response(); await getAllDanhGia({ query: { page: '2', limit: '10', so_sao: '5', ma_san_pham: '8' } }, res);
  assert.equal(res.body.pagination.totalPages, 3); assert.deepEqual(queries[1].args, [8, 5, 10, 10]);
});
test('product search count joins category and rejects bad pagination', async () => {
  const queries = []; pool.query = async (sql, args) => { queries.push({ sql, args }); return [sql.includes('COUNT') ? [{ total: 0 }] : []]; };
  const res = response(); await getAllSanPham({ query: { search: 'test' } }, res);
  assert.equal(res.statusCode, 200); assert.match(queries[0].sql, /LEFT JOIN danh_muc dm/); assert.deepEqual(queries[0].args, ['%test%', '%test%', '%test%']);
  const bad = response(); await getAllSanPham({ query: { limit: '-1' } }, bad); assert.equal(bad.statusCode, 400);
});
test('product foreign key delete errors are reported as conflicts', async () => {
  let calls = 0; pool.query = async () => { if (++calls === 1) return [[{ ma_san_pham: 1 }]]; throw Object.assign(new Error('FK'), { code: 'ER_ROW_IS_REFERENCED_2' }); };
  const res = response(); await deleteSanPham({ params: { id: '1' } }, res); assert.equal(res.statusCode, 409);
});
test('employee cannot link a customer account', async () => {
  pool.query = async () => [[]]; pool.execute = () => assert.fail('Invalid account inserted');
  const res = response(); await createNhanVien({ body: { ma_tai_khoan: 8, ho_ten: 'Test' } }, res);
  assert.equal(res.statusCode, 400); assert.ok(res.body.fieldErrors.ma_tai_khoan);
});
test('form validation returns field errors for negative prices and invalid email', () => {
  const res = response(); adminValidation({ method: 'POST', path: '/san-pham', body: { gia_ban: -1, email: 'bad' } }, res, () => assert.fail('Accepted invalid data'));
  assert.equal(res.statusCode, 400); assert.ok(res.body.fieldErrors.gia_ban); assert.ok(res.body.fieldErrors.email); assert.ok(res.body.fieldErrors.ten_san_pham);
});
