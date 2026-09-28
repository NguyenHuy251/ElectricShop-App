import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import reviewRoutes from '../dist/routes/danhGia.routes.js';
import { signToken } from '../dist/utils/jwt.js';
import { pool } from '../dist/config/database.js';
import { createDanhGia, updateDanhGia } from '../dist/controllers/danhGia.controller.js';
import { getDonHangById } from '../dist/controllers/donHang.controller.js';

const originalConnection = pool.getConnection, originalQuery = pool.query;
test.afterEach(() => { pool.getConnection = originalConnection; pool.query = originalQuery; });
test.after(async () => { await pool.end(); });
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
const request = (body = {}) => ({ user: { ma_tai_khoan: 4, vai_tro: 'KhachHang' }, body: { ma_don_hang: 12, ma_san_pham: 7, so_sao: 5, noi_dung: '  Rất tốt  ', ...body } });
function database({ status = 'ChoXacNhan', existing = false, fail = false } = {}) {
  const state = { inserts: [], commits: 0, rollbacks: 0, releases: 0 };
  pool.getConnection = async () => ({
    beginTransaction: async () => {}, commit: async () => { state.commits++; }, rollback: async () => { state.rollbacks++; }, release: () => { state.releases++; },
    query: async (sql, args) => {
      if (sql.includes('JOIN chi_tiet_don_hang')) {
        assert.deepEqual(args, [12, 4, 7]);
        assert.match(sql, /dh.ma_tai_khoan = \?/); assert.match(sql, /ct.ma_san_pham = \?/);
        return [status ? [{ trang_thai: status }] : []];
      }
      if (sql.includes('FROM danh_gia')) { assert.deepEqual(args, [7, 4]); return [existing ? [{ ma_danh_gia: 3 }] : []]; }
      assert.match(sql, /tai_khoan.*FOR UPDATE/); return [[{ ma_tai_khoan: 4 }]];
    },
    execute: async (sql, args) => { if (fail) throw new Error('Database unavailable'); state.inserts.push(args); return [{ insertId: 9 }]; },
  });
  return state;
}

test('reviews require authentication and valid integer IDs, stars and bounded text', async () => {
  pool.getConnection = () => assert.fail('Invalid review accessed database');
  const unauthenticated = response(); await createDanhGia({ body: {} }, unauthenticated); assert.equal(unauthenticated.statusCode, 401);
  for (const body of [{ so_sao: 0 }, { so_sao: 6 }, { so_sao: 2.5 }, { so_sao: '5' }, { ma_don_hang: 0 }, { ma_san_pham: -1 }, { noi_dung: {} }, { noi_dung: 'a'.repeat(2001) }]) {
    const res = response(); await createDanhGia(request(body), res); assert.equal(res.statusCode, 400);
  }
});

test('reviews reject absent or canceled purchases without inserting', async () => {
  for (const status of [null, 'DaHuy']) {
    const state = database({ status }), res = response(); await createDanhGia(request(), res);
    assert.equal(res.statusCode, 403); assert.equal(state.inserts.length, 0); assert.equal(state.rollbacks, 1); assert.equal(state.releases, 1);
  }
});

test('reviews accept purchased products in every non-canceled order status', async () => {
  for (const status of ['ChoXacNhan', 'DaXacNhan', 'DangGiao', 'DaGiao']) {
    const state = database({ status }), res = response(); await createDanhGia(request(), res);
    assert.equal(res.statusCode, 200); assert.equal(res.body.data.ma_danh_gia, 9);
    assert.deepEqual(state.inserts, [[7, 4, 5, 'Rất tốt']]); assert.equal(state.commits, 1); assert.equal(state.releases, 1);
  }
});

test('duplicate reviews are rejected and database errors roll back and release connection', async () => {
  const duplicate = database({ existing: true }), first = response(); await createDanhGia(request(), first);
  assert.equal(first.statusCode, 409); assert.equal(duplicate.inserts.length, 0); assert.equal(duplicate.rollbacks, 1); assert.equal(duplicate.releases, 1);
  const failed = database({ fail: true }), second = response(); await createDanhGia(request(), second);
  assert.equal(second.statusCode, 500); assert.equal(failed.commits, 0); assert.equal(failed.rollbacks, 1); assert.equal(failed.releases, 1);
});

test('review updates cannot bypass star and content validation', async () => {
  pool.query = () => assert.fail('Invalid update queried database');
  for (const body of [{ so_sao: 1.5 }, { so_sao: 8 }, { noi_dung: [] }, { noi_dung: 'a'.repeat(2001) }]) {
    const res = response(); await updateDanhGia({ ...request(), params: { id: '9' }, body }, res); assert.equal(res.statusCode, 400);
  }
});

test('order details restore saved reviews for the order owner', async () => {
  pool.query = async (sql, args) => {
    if (sql.includes('sp_don_hang_get_by_id')) return [[[{ ma_don_hang: 12, ma_tai_khoan: 4 }], [{ ma_san_pham: 7 }]]];
    if (sql.includes('FROM chi_tiet_don_hang')) return [[{ ma_san_pham: 7 }]];
    assert.match(sql, /FROM danh_gia/); assert.deepEqual(args, [4]);
    return [[{ ma_danh_gia: 9, ma_san_pham: 7, so_sao: 5, noi_dung: 'Rất tốt' }]];
  };
  const res = response(); await getDonHangById({ ...request(), params: { id: '12' } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.data.reviews[0].ma_danh_gia, 9);
});

test('review route permits all buyer roles but still rejects orders they do not own', async () => {
  const app = express(); app.use(express.json()); app.use('/reviews', reviewRoutes);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const vai_tro of ['KhachHang', 'Admin', 'NhanVien']) {
      const user = { ma_tai_khoan: 4, ten_dang_nhap: 'buyer', vai_tro, trang_thai: 'HoatDong' };
      pool.query = async () => [[user]];
      const token = signToken(user);
      for (const ownsOrder of [true, false]) {
        const state = database({ status: ownsOrder ? 'DaGiao' : null });
        const res = await fetch(`http://127.0.0.1:${server.address().port}/reviews`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(request().body),
        });
        assert.equal(res.status, ownsOrder ? 200 : 403, vai_tro);
        assert.equal(state.inserts.length, ownsOrder ? 1 : 0);
        await res.json();
      }
    }
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
