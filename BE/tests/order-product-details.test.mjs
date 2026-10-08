import test from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../dist/config/database.js';
import { getDonHangById } from '../dist/services/donHang.service.js';

const original = pool.query;
test.afterEach(() => { pool.query = original; });
test.after(async () => { await pool.end(); });

test('order lines preserve purchase values and merge only their own variant specifications', async () => {
  const items = [11, 12, 13, null].map(id => ({ma_san_pham:7,ma_bien_the:id,ten_san_pham:'Purchased name',ten_bien_the:'Purchased variant',don_gia:100,so_luong:2,thanh_tien:200}));
  pool.query = async (sql, args) => {
    if (sql.includes('sp_don_hang_get_by_id')) return [[[{ma_don_hang:1}],items]];
    if (sql.includes('JOIN thong_so ts')) return [[
      {ma_san_pham:7,ma_thong_so:1,ten_thong_so:'Power',don_vi:'W',gia_tri:'600'},
      {ma_san_pham:7,ma_thong_so:2,ten_thong_so:'Color',gia_tri:'White'},
      {ma_san_pham:7,ma_thong_so:3,ten_thong_so:'Feature',gia_tri_bool:1},
    ]];
    if (sql.includes('FROM san_pham p')) { assert.deepEqual(args,[[7]]); return [[{ma_san_pham:7,ma_san_pham_code:'SP7',hinh_anh:'/product.jpg',bao_hanh:12}]]; }
    if (sql.includes('FROM san_pham_bien_the')) return [[
      {ma_bien_the:11,ma_san_pham:7,ma_sku:'RED700',thong_so_json:JSON.stringify([{ma_thong_so:1,gia_tri_so:700},{ma_thong_so:2,gia_tri:'Red'},{ma_thong_so:3,gia_tri_bool:false}])},
      {ma_bien_the:12,ma_san_pham:7,ma_sku:'RED900',thong_so_json:[{ma_thong_so:1,gia_tri:'900W'},{ma_thong_so:2,gia_tri:'Red'}]},
      {ma_bien_the:13,ma_san_pham:99,ma_sku:'WRONG',thong_so_json:[{ma_thong_so:1,gia_tri:999}]},
    ]];
    if (sql.includes('FROM don_hang')) return [[]];
    assert.fail(sql);
  };
  const result = await getDonHangById(1);
  const [a,b,c,d] = result.items;
  for (const [index,item] of result.items.entries()) for (const [key,value] of Object.entries(items[index])) assert.equal(item[key],value);
  assert.equal(a.product_details.ma_sku,'RED700');
  assert.deepEqual(a.product_details.thong_so_ky_thuat.map(s=>s.gia_tri),['700 W','Red','Không']);
  assert.deepEqual(b.product_details.thong_so_ky_thuat.map(s=>s.gia_tri),['900W','Red','Có']);
  assert.equal(c.product_details.ma_sku,null);
  assert.equal(c.product_details.thong_so_ky_thuat[0].gia_tri,'600 W');
  assert.equal(d.product_details.thong_so_ky_thuat[0].gia_tri,'600 W');
  assert.equal(a.hinh_anh,'/product.jpg');
});

test('missing catalog data and malformed variant JSON do not remove purchased lines', async () => {
  pool.query = async sql => {
    if (sql.includes('sp_don_hang_get_by_id')) return [[[{ma_don_hang:1}],[{ma_san_pham:7,ma_bien_the:11,ten_san_pham:'Old',don_gia:123},{ma_san_pham:8,ten_san_pham:'Removed',hinh_anh:'/saved.jpg'}]]];
    if (sql.includes('JOIN thong_so ts')) return [[]];
    if (sql.includes('FROM san_pham p')) return [[{ma_san_pham:7}]];
    if (sql.includes('FROM san_pham_bien_the')) return [[{ma_san_pham:7,ma_bien_the:11,thong_so_json:'broken'}]];
    return [[]];
  };
  const {items} = await getDonHangById(1);
  assert.deepEqual(items[0].product_details.thong_so_ky_thuat,[]);
  assert.equal(items[0].don_gia,123);
  assert.equal(items[1].product_details,null);
  assert.equal(items[1].ten_san_pham,'Removed');
  assert.equal(items[1].hinh_anh,'/saved.jpg');
});
