import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

test('vouchers work with the existing database schema', { skip: process.env.CHECKOUT_INTEGRATION !== '1' }, async t => {
  dotenv.config();
  const database = `electric_voucher_test_${Date.now()}_${process.pid}`;
  const admin = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  let pool;
  try {
    await admin.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`);
    await admin.query(`USE \`${database}\``);
    await admin.query(`CREATE TABLE voucher (
      ma_voucher INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(32) NOT NULL UNIQUE,
      loai ENUM('PhanTram','SoTien') NOT NULL, gia_tri DECIMAL(15,2) NOT NULL,
      don_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0, giam_toi_da DECIMAL(15,2) NULL,
      bat_dau DATETIME NOT NULL, ket_thuc DATETIME NOT NULL, gioi_han INT NOT NULL,
      moi_khach INT NOT NULL DEFAULT 1, hoat_dong BOOLEAN NOT NULL DEFAULT 1);
      CREATE TABLE voucher_su_dung (ma_don_hang INT PRIMARY KEY, ma_voucher INT NOT NULL,
      ma_tai_khoan INT NOT NULL, code VARCHAR(32) NOT NULL, tam_tinh DECIMAL(15,2),
      tien_giam DECIMAL(15,2), hoan_luot BOOLEAN NOT NULL DEFAULT 0);
      CREATE TABLE tai_khoan (ma_tai_khoan INT PRIMARY KEY,ten_dang_nhap VARCHAR(50),
      vai_tro VARCHAR(20),trang_thai VARCHAR(20),token_version INT DEFAULT 0);
      INSERT INTO tai_khoan VALUES (1,'admin','Admin','HoatDong',0),(2,'customer','KhachHang','HoatDong',0);`);
    process.env.DB_NAME = database;
    ({ pool } = await import('../dist/config/database.js'));
    const { createVoucher,listVouchers,recordVoucherUsage,setVoucherActive,customerVouchers } = await import('../dist/services/voucher.service.js');
    const { priceCheckout } = await import('../dist/services/pricing.service.js');
    const { summarizeCart } = await import('../dist/utils/checkout.js');
    const quote = amount => summarizeCart([{ma_san_pham:1,ten_san_pham:'Test product',gia_ban:amount,so_luong:1,ton_kho:10,trang_thai:'DangBan'}]);
    const input = code => ({ma_code:code,giam_tien:20000,don_toi_thieu:50000,so_luot:5,bat_dau:new Date(Date.now()-60000),ket_thuc:new Date(Date.now()+3600000)});

    await t.test('admin creates, lists and toggles codes through the API; customers cannot manage codes', async () => {
      const {default:express} = await import('express');
      const {default:router} = await import('../dist/routes/shop.routes.js');
      const {signToken} = await import('../dist/utils/jwt.js');
      const app=express();app.use(express.json());app.use('/shop',router);
      const server=await new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));});
      const request=async(path,method='GET',body,accountId=1)=>{
        const response=await fetch(`http://127.0.0.1:${server.address().port}/shop${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${signToken({ma_tai_khoan:accountId,ten_dang_nhap:'test',vai_tro:accountId===1?'Admin':'KhachHang'})}`},...(body?{body:JSON.stringify(body)}:{})});
        return {status:response.status,body:await response.json()};
      };
      try {
        assert.equal((await request('/vouchers','POST',input('FIXED'))).status,200);
        assert.equal((await request('/vouchers','POST',input('FIXED'))).status,409);
        const listed=await request('/vouchers');assert.equal(listed.status,200);
        assert.equal(listed.body.data[0].ma_code,'FIXED');assert.equal(listed.body.data[0].da_dung,0);
        const id=listed.body.data[0].ma_voucher;
        assert.equal((await request(`/vouchers/${id}`,'PUT',{trang_thai:false})).status,200);
        await assert.rejects(priceCheckout(pool,quote(100000),'FIXED',false,2),error=>error.status===409);
        await setVoucherActive(id,true);
        assert.equal((await request('/vouchers','GET',undefined,2)).status,403);
        const mine = await request('/my-vouchers?tam_tinh=100000','GET',undefined,2);
        assert.equal(mine.status,200); assert.equal(mine.body.data[0].ma_code,'FIXED');
        assert.equal(mine.body.data[0].co_the_dung,true);
        assert.equal('da_dung_cua_khach' in mine.body.data[0],false);
        assert.equal((await request('/my-vouchers?tam_tinh=1000','GET',undefined,2)).body.data[0].co_the_dung,false);
        assert.equal((await request('/my-vouchers?tam_tinh=-1','GET',undefined,2)).status,400);
        const anonymous = await fetch(`http://127.0.0.1:${server.address().port}/shop/my-vouchers`);
        assert.equal(anonymous.status,401);
      } finally {await new Promise(resolve=>server.close(resolve));}
    });

    await t.test('fixed and percentage discounts honor the minimum, cap and customer limit', async () => {
      const fixed=await priceCheckout(pool,quote(100000),'FIXED',false,2);
      assert.equal(fixed.giam_gia,20000);
      await assert.rejects(priceCheckout(pool,quote(1000),'FIXED',false,2),error=>error.status===409);
      await recordVoucherUsage(pool,100,2,fixed);
      await assert.rejects(priceCheckout(pool,quote(100000),'FIXED',false,2),error=>error.status===409);
      assert.equal((await customerVouchers(2,100000)).find(v=>v.ma_code==='FIXED').co_the_dung,false);
      assert.equal((await customerVouchers(3,100000)).find(v=>v.ma_code==='FIXED').co_the_dung,true);
      await admin.query("INSERT INTO voucher (code,loai,gia_tri,giam_toi_da,bat_dau,ket_thuc,gioi_han) VALUES ('PERCENT','PhanTram',10,5000,NOW()-INTERVAL 1 DAY,NOW()+INTERVAL 1 DAY,10)");
      assert.equal((await priceCheckout(pool,quote(100000),'PERCENT',false,2)).giam_gia,5000);
      assert.equal((await priceCheckout(pool,quote(10000),'PERCENT',false,2)).giam_gia,1000);
    });

    await t.test('the last use is reserved atomically and failed transactions do not spend a code', async () => {
      await createVoucher({...input('LAST'),so_luot:1});
      const attempt=async(accountId,orderId,fail=false)=>{
        const db=await pool.getConnection();
        try {
          await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');await db.beginTransaction();
          const priced=await priceCheckout(db,quote(100000),'LAST',true,accountId);
          await recordVoucherUsage(db,orderId,accountId,priced);
          if(fail)throw new Error('Injected rollback');
          await db.commit();return priced;
        } catch(error){await db.rollback();throw error;}finally{db.release();}
      };
      await assert.rejects(attempt(2,200,true));
      const results=await Promise.allSettled([attempt(2,201),attempt(3,202)]);
      assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
      assert.equal((await listVouchers()).find(row=>row.ma_code==='LAST').da_dung,1);
    });

    await t.test('canceled usage follows existing refund records and expired codes are rejected', async () => {
      await admin.query('UPDATE voucher_su_dung SET hoan_luot=1 WHERE ma_don_hang=100');
      assert.equal((await priceCheckout(pool,quote(100000),'FIXED',false,2)).giam_gia,20000);
      await admin.query("UPDATE voucher SET ket_thuc=NOW()-INTERVAL 1 MINUTE WHERE code='FIXED'");
      await assert.rejects(priceCheckout(pool,quote(100000),'FIXED',false,2),error=>error.status===409);
      assert.equal((await customerVouchers(2)).some(v=>v.ma_code==='FIXED'),false);
      await admin.query("UPDATE voucher SET hoat_dong=0 WHERE code='PERCENT'");
      assert.equal((await customerVouchers(2)).some(v=>v.ma_code==='PERCENT'),false);
    });
  } finally {
    if(pool)await pool.end();
    assert.match(database,/^electric_voucher_test_\d+_\d+$/);
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);await admin.end();
  }
});
