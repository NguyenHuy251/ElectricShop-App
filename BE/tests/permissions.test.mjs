import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { pool } from '../dist/config/database.js';
import { signToken } from '../dist/utils/jwt.js';
import { getDonHang, getDonHangById } from '../dist/controllers/donHang.controller.js';
import { deleteDanhGia } from '../dist/controllers/danhGia.controller.js';

const originalQuery = pool.query;
test.afterEach(() => { pool.query = originalQuery; });
test.after(async () => { await pool.end(); });
const response = () => ({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});

test('actual management routes enforce staff group permissions including deletion and aliases', async () => {
  let permissions = [], writes = 0;
  pool.query = async (sql) => {
    if (sql.includes('token_version')) return [[{ma_tai_khoan:5,ten_dang_nhap:'staff',vai_tro:'NhanVien',trang_thai:'HoatDong'}]];
    if (sql.includes('staff_permissions')) return [[{permissions}]];
    writes++;
    if (sql.includes('sp_thuong_hieu_get_by_id')) return [[[{ma_thuong_hieu:1}]]];
    return [[[]]];
  };
  const app = express(); app.use(express.json());
  const mounts = [['sanPham','san-pham'],['sanPham','products'],['danhMuc','danh-muc'],['thuongHieu','thuong-hieu'],['thongSo','specifications'],['donHang','don-hang'],['lienHe','lien-he'],['danhGia','danh-gia'],['dashboard','dashboard'],['shop','shop'],['upload','uploads']];
  for (const [file,path] of mounts) app.use('/api/'+path,(await import(`../dist/routes/${file}.routes.js`)).default);
  const server = await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
  try {
    const token = signToken({ma_tai_khoan:5,ten_dang_nhap:'staff',vai_tro:'NhanVien'});
    const request = (path, method = 'GET') => fetch(`http://127.0.0.1:${server.address().port}/api/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(method==='POST'||method==='PUT'?{body:'{}'}:{})});
    for (const [path, method] of [['san-pham/1','DELETE'],['products/1','DELETE'],['danh-muc/1','DELETE'],['thuong-hieu/1','DELETE'],['specifications/1','DELETE'],['don-hang/1','DELETE'],['don-hang/1/trang-thai','PUT'],['lien-he/1','DELETE'],['danh-gia','GET'],['dashboard','GET'],['shop/reports','GET'],['shop/inventory','POST'],['shop/vouchers','POST'],['uploads','POST']]) assert.equal((await request(path,method)).status,403,`${method} ${path}`);
    assert.equal(writes,0);
    permissions=['catalog'];
    assert.equal((await request('thuong-hieu/1','DELETE')).status,200);
    assert.ok(writes>0);
    permissions=[];
    assert.equal((await request('thuong-hieu/1','DELETE')).status,403);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('staff without orders permission sees only their purchases and cannot view another owner', async () => {
  const calls=[];
  pool.query=async(sql,args)=>{
    calls.push({sql,args});
    if(sql.includes('sp_don_hang_list')) return [[[],[]]];
    if(sql.includes('sp_don_hang_get_by_id')) return [[[{ma_don_hang:1,ma_tai_khoan:7,trang_thai:'DaGiao'}],[]]];
    return [[]];
  };
  const req={user:{ma_tai_khoan:5,vai_tro:'NhanVien',permissions:[]},params:{id:'1'}};
  await getDonHang(req,response());
  assert.deepEqual(calls[0].args,[5, true]);
  const forbidden=response();await getDonHangById(req,forbidden);assert.equal(forbidden.statusCode,403);
  req.user.permissions=['orders'];
  const allowed=response();await getDonHangById(req,allowed);assert.equal(allowed.statusCode,200);
});

test('staff review moderation requires reviews permission but own reviews remain accessible', async () => {
  let deleted=0;
  pool.query=async(sql)=>{
    if(sql.includes('sp_danh_gia_get_by_id')) return [[[{ma_danh_gia:1,ma_tai_khoan:7}]]];
    deleted++; return [[]];
  };
  const req={user:{ma_tai_khoan:5,vai_tro:'NhanVien',permissions:[]},params:{id:'1'}};
  const forbidden=response();await deleteDanhGia(req,forbidden);assert.equal(forbidden.statusCode,404);assert.equal(deleted,0);
  req.user.permissions=['reviews'];
  const allowed=response();await deleteDanhGia(req,allowed);assert.equal(allowed.statusCode,200);assert.equal(deleted,1);
});
