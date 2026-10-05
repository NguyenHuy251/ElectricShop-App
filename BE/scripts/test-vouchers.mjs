import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pool } from '../dist/config/database.js';
import { previewCheckout, createDonHang } from '../dist/controllers/checkout.controller.js';
const res=()=>({statusCode:200,status(c){this.statusCode=c;return this;},json(body){this.body=body;return this;}});
const orders=[], requests=[];let productId,voucherId;
try {
 const [customers]=await pool.query("SELECT ma_tai_khoan FROM tai_khoan WHERE vai_tro='KhachHang' AND trang_thai='HoatDong' LIMIT 1");assert.ok(customers.length);
 const user={ma_tai_khoan:customers[0].ma_tai_khoan,vai_tro:'KhachHang'};
 const [products]=await pool.query('SELECT ma_danh_muc,ma_thuong_hieu FROM san_pham LIMIT 1');
 const [insert]=await pool.execute("INSERT INTO san_pham(ma_danh_muc,ma_thuong_hieu,ma_san_pham_code,ten_san_pham,gia_ban,so_luong,trang_thai) VALUES(?,?,?,'Voucher test',1000000,10,'DangBan')",[products[0].ma_danh_muc,products[0].ma_thuong_hieu,randomUUID()]);productId=insert.insertId;
 const code='TEST_'+randomUUID().replaceAll('-','').slice(0,15).toUpperCase();
 const [voucher]=await pool.execute("INSERT INTO voucher(code,loai,gia_tri,don_toi_thieu,giam_toi_da,bat_dau,ket_thuc,gioi_han,moi_khach,hoat_dong) VALUES(?,'PhanTram',10,1000000,200000,DATE_SUB(NOW(),INTERVAL 1 DAY),DATE_ADD(NOW(),INTERVAL 1 DAY),1,1,1)",[code]);voucherId=voucher.insertId;
 const query={source:'buy_now',ma_san_pham:String(productId),so_luong:'1',ma_giam_gia:code};let preview=res();await previewCheckout({user,query},preview);assert.equal(preview.statusCode,200);assert.equal(preview.body.data.tong_tien,900000);
 const payload=()=>{const id='test_'+randomUUID().replaceAll('-','');requests.push(id);return {source:'buy_now',ma_san_pham:productId,so_luong:1,ma_giam_gia:code,snapshot:preview.body.data.snapshot,request_id:id,ho_ten_nguoi_nhan:'Khách kiểm thử',so_dien_thoai:'0912345678',dia_chi_giao_hang:'123 đường kiểm thử Hà Nội',ghi_chu:'',phuong_thuc_thanh_toan:'ThanhToanKhiNhanHang'};};
 const inputs=[payload(),payload()],responses=[res(),res()];
 await Promise.all(inputs.map((body,i)=>createDonHang({user,body},responses[i])));
 for(const response of responses)if(response.body.data?.ma_don_hang)orders.push(response.body.data.ma_don_hang);
 assert.deepEqual(responses.map(r=>r.statusCode).sort(),[200,409]);
 const success=responses.findIndex(r=>r.statusCode===200);const retry=res();await createDonHang({user,body:inputs[success]},retry);assert.equal(retry.body.data.ma_don_hang,orders[0]);
 let [usage]=await pool.query('SELECT COUNT(*) AS total FROM voucher_su_dung WHERE ma_voucher=? AND hoan_luot=0',[voucherId]);assert.equal(usage[0].total,1);
 await pool.execute("UPDATE don_hang SET trang_thai='DaHuy' WHERE ma_don_hang=?",[orders[0]]);
 [usage]=await pool.query('SELECT COUNT(*) AS total FROM voucher_su_dung WHERE ma_voucher=? AND hoan_luot=0',[voucherId]);assert.equal(usage[0].total,0);
 const after=res();await previewCheckout({user,query},after);assert.equal(after.statusCode,200);
 console.log('PASS: discount preview, concurrent last-use limit, idempotent retry, cancellation refund and reuse.');
}finally{
 if(voucherId)await pool.execute('DELETE FROM voucher_su_dung WHERE ma_voucher=?',[voucherId]);
 for(const id of orders){await pool.execute('DELETE FROM chi_tiet_don_hang WHERE ma_don_hang=?',[id]);await pool.execute('DELETE FROM don_hang WHERE ma_don_hang=?',[id]);}
 for(const id of requests)await pool.execute('DELETE FROM checkout_requests WHERE request_id=?',[id]);
 if(voucherId)await pool.execute('DELETE FROM voucher WHERE ma_voucher=?',[voucherId]);
 if(productId)await pool.execute('DELETE FROM san_pham WHERE ma_san_pham=?',[productId]);
 await pool.end();
}
