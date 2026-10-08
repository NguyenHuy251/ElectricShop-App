import test from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../dist/config/database.js';
import { confirmOrderReceipt } from '../dist/controllers/donHang.controller.js';

const original = pool.getConnection;
test.afterEach(() => {pool.getConnection=original;});
test.after(async () => {await pool.end();});
const response = () => ({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});
const request = () => ({user:{ma_tai_khoan:4,vai_tro:'KhachHang'},params:{id:'12'}});
function database(status='DangGiao',fail=false) {
  const state={writes:0,commits:0,rollbacks:0,releases:0};
  pool.getConnection=async()=>({
    beginTransaction:async()=>{},commit:async()=>{state.commits++;},rollback:async()=>{state.rollbacks++;},release:()=>{state.releases++;},
    query:async(sql,args)=>{assert.match(sql,/ma_tai_khoan=\?.*FOR UPDATE/);assert.deepEqual(args,[12,4]);return [status?[{ma_don_hang:12,trang_thai:status}]:[]];},
    execute:async(sql,args)=>{assert.match(sql,/trang_thai='DaGiao'.*ma_tai_khoan=\?.*trang_thai='DangGiao'/);assert.deepEqual(args,[12,4]);if(fail)throw new Error('DB failed');state.writes++;status='DaGiao';return [{affectedRows:1}];},
  });
  return state;
}
test('receipt requires authentication, buyer role and a valid order ID',async()=>{
  pool.getConnection=()=>assert.fail('Invalid request accessed DB');
  for(const [req,code] of [[{params:{id:'12'}},401],[{...request(),user:{ma_tai_khoan:4,vai_tro:'NhanVien'}},403],...[0,-1,'1.5','oops','9007199254740992'].map(id=>[{...request(),params:{id:String(id)}},400])]){
    const res=response();await confirmOrderReceipt(req,res);assert.equal(res.statusCode,code);
  }
});
test('only an owned order being delivered can be confirmed',async()=>{
  for(const status of [null,'ChoXacNhan','DaXacNhan','DaHuy']){
    const state=database(status),res=response();await confirmOrderReceipt(request(),res);
    assert.equal(res.statusCode,status===null?404:409);assert.equal(state.writes,0);assert.equal(state.rollbacks,1);assert.equal(state.releases,1);
  }
});
test('confirming receipt commits once, repeat confirmation is safe and does not alter stock',async()=>{
  const state=database();
  for(let i=0;i<2;i++){const res=response();await confirmOrderReceipt(request(),res);assert.equal(res.statusCode,200);assert.equal(res.body.data.trang_thai,'DaGiao');}
  assert.equal(state.writes,1);assert.equal(state.commits,2);assert.equal(state.releases,2);
});
test('a failed receipt update rolls back and releases its connection',async()=>{
  const state=database('DangGiao',true),res=response();await confirmOrderReceipt(request(),res);
  assert.equal(res.statusCode,500);assert.equal(state.commits,0);assert.equal(state.rollbacks,1);assert.equal(state.releases,1);
});
