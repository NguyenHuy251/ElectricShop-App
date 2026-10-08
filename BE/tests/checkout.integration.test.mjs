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
    const schema = await readFile(new URL('../database/database.sql', import.meta.url), 'utf8');
    await admin.query(schema.slice(schema.indexOf('CREATE TABLE tai_khoan'), schema.indexOf('INSERT INTO tai_khoan')));
    // Order-detail authorization calls this routine before checking the owner.
    const detailProcedure = schema.match(/CREATE PROCEDURE sp_don_hang_get_by_id\([\s\S]*?\$\$/)?.[0];
    assert.ok(detailProcedure, 'Order detail procedure must exist in the test schema');
    await admin.query(detailProcedure.slice(0, -2));
    const listProcedure = schema.match(/CREATE PROCEDURE sp_don_hang_list\([\s\S]*?\$\$/)?.[0];
    assert.ok(listProcedure, 'Order list procedure must exist in the test schema');
    await admin.query(listProcedure.slice(0, -2));
    process.env.DB_NAME = database;
    ({ pool } = await import('../dist/config/database.js'));
    await admin.query(await readFile(new URL('../migrations/005_product_variants.sql', import.meta.url), 'utf8'));
    const { migrateCommerce } = await import('../scripts/migrate-commerce.mjs');
    for (const name of ['sp_don_hang_update_status','sp_don_hang_cancel']) {
      const start=schema.indexOf('CREATE PROCEDURE '+name+'(');
      assert.ok(start>=0);const end=schema.indexOf('$'+'$',start);
      await admin.query(schema.slice(start,end));
    }
    await migrateCommerce();
    const { migrateLocal } = await import('../scripts/migrate-local.mjs');
    await migrateLocal();
    const { createDonHang, previewCheckout } = await import('../dist/controllers/checkout.controller.js');
    const { cancelDonHang, getDonHangById } = await import('../dist/controllers/donHang.controller.js');
    const { addToCart, updateCartItem } = await import('../dist/controllers/gioHang.controller.js');
    const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
    const user = id => ({ ma_tai_khoan: id, vai_tro: 'KhachHang' });
    const invoke = async (fn, req) => { const res = response(); await fn(req, res); return res; };
    await admin.query("INSERT INTO tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau, ho_ten) VALUES (1, 'test1', 'unused', 'Test One'), (2, 'test2', 'unused', 'Test Two'); INSERT INTO danh_muc (ma_danh_muc, ten_danh_muc) VALUES (1, 'Test'); INSERT INTO thuong_hieu (ma_thuong_hieu, ten_thuong_hieu) VALUES (1, 'Test'); INSERT INTO san_pham (ma_san_pham, ma_danh_muc, ma_thuong_hieu, ma_san_pham_code, ten_san_pham, gia_ban, so_luong) VALUES (1, 1, 1, 'TEST', 'Test product', 100000, 10); INSERT INTO gio_hang (ma_gio_hang, ma_tai_khoan) VALUES (1, 1), (2, 2)");
    const reset = async () => admin.query("DELETE FROM checkout_requests; DELETE FROM chi_tiet_don_hang; DELETE FROM don_hang; DELETE FROM chi_tiet_gio_hang; DELETE FROM san_pham_bien_the; INSERT IGNORE INTO gio_hang (ma_gio_hang,ma_tai_khoan) VALUES (1,1),(2,2); UPDATE san_pham SET so_luong = 10, gia_ban = 100000, trang_thai = 'DangBan'; INSERT INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,so_luong) VALUES (1, 1, 2)");
    const payload = async (id = 1, key = 'checkout_integration_123456') => ({ ho_ten_nguoi_nhan: 'Test Customer', so_dien_thoai: '0912345678', dia_chi_giao_hang: '12 Nguyen Trai, Ha Noi', ghi_chu: 'Test', phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang', request_id: key, snapshot: (await invoke(previewCheckout, { user: user(id) })).body.data.snapshot });
    const count = async table => Number((await admin.query(`SELECT COUNT(*) AS n FROM ${table}`))[0][0].n);
    const stock = async () => Number((await admin.query('SELECT so_luong FROM san_pham WHERE ma_san_pham = 1'))[0][0].so_luong);
    const direct = async (id = 1, quantity = 1) => {
      const selection = { source: 'buy_now', ma_san_pham: 1, so_luong: quantity };
      const quote = await invoke(previewCheckout, { user: user(id), query: selection });
      return { ...await payload(id), ...selection, snapshot: quote.body.data.snapshot };
    };


    await t.test('migration removes stale variant triggers for generated columns and stays idempotent', async () => {
      await admin.query('INSERT INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,so_luong) VALUES (1,1,2)');
      for (const table of ['chi_tiet_gio_hang','chi_tiet_don_hang']) {
        const parent=table==='chi_tiet_gio_hang'?'ma_gio_hang':'ma_don_hang';
        await admin.query('ALTER TABLE '+table+' DROP PRIMARY KEY, ADD COLUMN test_line_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
        await admin.query('ALTER TABLE '+table+' DROP COLUMN variant_key, ADD COLUMN variant_key INT GENERATED ALWAYS AS (IFNULL(ma_bien_the,0)) STORED, ADD UNIQUE KEY uq_test_line ('+parent+',ma_san_pham,variant_key)');
      }
      for (const table of ['chi_tiet_gio_hang','chi_tiet_don_hang']) for (const event of ['INSERT','UPDATE']) {
        const name=table+'_variant_'+event.toLowerCase();
        await admin.query('DROP TRIGGER IF EXISTS '+name);
        await admin.query('CREATE TRIGGER '+name+' BEFORE '+event+' ON '+table+' FOR EACH ROW SET NEW.variant_key = COALESCE(NEW.ma_bien_the, 0)');
      }

      await migrateCommerce();
      await migrateCommerce();
      const [triggers]=await admin.query("SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME IN ('chi_tiet_gio_hang_variant_insert','chi_tiet_gio_hang_variant_update','chi_tiet_don_hang_variant_insert','chi_tiet_don_hang_variant_update')");
      assert.equal(triggers.length,0);
      const [lines]=await admin.query('SELECT variant_key,so_luong FROM chi_tiet_gio_hang');
      assert.equal(lines.length,1);assert.equal(lines[0].variant_key,0);assert.equal(lines[0].so_luong,2);
    });

    await t.test('checkout repairs old notifications when the title column is required', async () => {
      await admin.query('ALTER TABLE thong_bao MODIFY COLUMN tieu_de VARCHAR(150) NOT NULL');
      await admin.query('ALTER TABLE thong_bao ALTER COLUMN tieu_de DROP DEFAULT');
      await admin.query('DROP TRIGGER order_created_notification');
      await admin.query("CREATE TRIGGER order_created_notification AFTER INSERT ON don_hang FOR EACH ROW INSERT INTO thong_bao (ma_tai_khoan,noi_dung,ma_don_hang) VALUES (NEW.ma_tai_khoan,'Order created',NEW.ma_don_hang)");
      await assert.rejects(admin.query("INSERT INTO don_hang (ma_tai_khoan,ho_ten_nguoi_nhan,so_dien_thoai,dia_chi_giao_hang) VALUES (1,'Test Customer','0912345678','Test Address')"),error=>error.code==='ER_NO_DEFAULT_FOR_FIELD' && error.message.includes('tieu_de'));
      await migrateLocal();await migrateLocal();
      await reset();
      const placed=await invoke(createDonHang,{user:user(1),body:await direct()});
      assert.equal(placed.statusCode,200);
      const [notifications]=await admin.query('SELECT tieu_de FROM thong_bao WHERE ma_don_hang=?',[placed.body.data.ma_don_hang]);
      assert.equal(notifications.length,1);assert.ok(notifications[0].tieu_de.length>0);
      await reset();
    });

    await t.test('catalog saves product, images and variants atomically and retains variant IDs', async () => {
      await admin.query('ALTER TABLE san_pham_bien_the ADD COLUMN thong_so_json JSON NULL');
      await admin.query('CREATE TABLE hinh_anh_san_pham (ma_hinh_anh INT AUTO_INCREMENT PRIMARY KEY, ma_san_pham INT,duong_dan TEXT,mo_ta TEXT,la_anh_chinh BOOLEAN,thu_tu_hien_thi INT)');
      const {createSanPham,updateSanPham}=await import('../dist/services/sanPham.service.js');
      const params=[1,1,'ATOMIC','Atomic product',null,100,200,5,12,null,'DangBan',null];
      const variants=[{ma_sku:'ATOMIC-A',ten_bien_the:'A',gia_ban:300,so_luong:2,trang_thai:'DangBan',thong_so_ky_thuat:[]}];
      const id=await createSanPham(params,['/uploads/test.png'],variants);
      const original=(await admin.query('SELECT ma_bien_the FROM san_pham_bien_the WHERE ma_san_pham=?',[id]))[0][0].ma_bien_the;
      await assert.rejects(createSanPham([1,1,'ATOMIC-FAIL',...params.slice(3)],['/uploads/fail.png'],variants));
      assert.equal((await admin.query("SELECT COUNT(*) AS n FROM san_pham WHERE ma_san_pham_code='ATOMIC-FAIL'"))[0][0].n,0);
      await assert.rejects(updateSanPham([1,1,1,'TEST-CHANGED',...params.slice(3)],['/uploads/should-rollback.png'],variants));
      assert.equal((await admin.query('SELECT ma_san_pham_code FROM san_pham WHERE ma_san_pham=1'))[0][0].ma_san_pham_code,'TEST');
      await updateSanPham([id,...params],['/uploads/new.png'],[{...variants[0],gia_ban:400}]);
      assert.equal((await admin.query('SELECT ma_bien_the FROM san_pham_bien_the WHERE ma_san_pham=?',[id]))[0][0].ma_bien_the,original);
      assert.equal((await admin.query('SELECT hinh_anh FROM san_pham WHERE ma_san_pham=?',[id]))[0][0].hinh_anh,'/uploads/new.png');
      await updateSanPham([id,...params],[],variants);
      assert.equal((await admin.query('SELECT hinh_anh FROM san_pham WHERE ma_san_pham=?',[id]))[0][0].hinh_anh,null);
      assert.equal((await admin.query('SELECT COUNT(*) AS n FROM hinh_anh_san_pham WHERE ma_san_pham=?',[id]))[0][0].n,0);
      await admin.query('DELETE FROM hinh_anh_san_pham WHERE ma_san_pham=?',[id]);
      await admin.query('DELETE FROM san_pham WHERE ma_san_pham=?',[id]);
    });


    await t.test('refresh tokens rotate once, logout revokes and password changes invalidate sessions', async () => {
      const {issueSession,refreshSession,revokeSession}=await import('../dist/services/session.service.js');
      const first=await issueSession(1);
      const attempts=await Promise.allSettled([refreshSession(first.refresh_token),refreshSession(first.refresh_token)]);
      assert.equal(attempts.filter(result=>result.status==='fulfilled').length,1);
      const rotated=attempts.find(result=>result.status==='fulfilled').value;
      await assert.rejects(refreshSession(first.refresh_token));
      await revokeSession(rotated.refresh_token);await assert.rejects(refreshSession(rotated.refresh_token));
      const before=await issueSession(1);await admin.query('UPDATE tai_khoan SET token_version=token_version+1 WHERE ma_tai_khoan=1');
      await assert.rejects(refreshSession(before.refresh_token));
      await admin.query('UPDATE tai_khoan SET token_version=0 WHERE ma_tai_khoan=1');
    });

    await t.test('variants remain distinct, checkout reserves only variant stock and cancellation restores once', async () => {
      await reset();
      await admin.query("DELETE FROM chi_tiet_gio_hang; INSERT INTO san_pham_bien_the (ma_bien_the,ma_san_pham,ma_sku,ten_bien_the,gia_ban,so_luong) VALUES (101,1,'TEST-A','A',120000,3),(102,1,'TEST-B','B',180000,4)");
      for (const variant of [101,102]) {
        const res = await invoke(addToCart,{user:user(1),body:{ma_san_pham:1,ma_bien_the:variant,so_luong:1},params:{}});
        assert.equal(res.statusCode,200);
      }
      const [lines] = await admin.query('SELECT * FROM chi_tiet_gio_hang');
      assert.equal(lines.length,2);
      const quote = (await invoke(previewCheckout,{user:user(1),query:{}})).body.data;
      assert.equal(quote.tong_tien,300000);
      const body = {...await payload(),snapshot:quote.snapshot};
      const results = await Promise.all([1,2].map(()=>invoke(createDonHang,{user:user(1),body})));
      assert.deepEqual(results.map(r=>r.statusCode),[200,200]);
      assert.equal(results[0].body.data.ma_don_hang,results[1].body.data.ma_don_hang);
      const orderId = results[0].body.data.ma_don_hang;
      assert.equal(await stock(),10);
      assert.deepEqual((await admin.query('SELECT so_luong FROM san_pham_bien_the ORDER BY ma_bien_the'))[0].map(r=>r.so_luong),[2,3]);
      assert.equal((await invoke(cancelDonHang,{user:user(1),params:{id:orderId}})).statusCode,200);
      assert.equal((await invoke(cancelDonHang,{user:user(1),params:{id:orderId}})).statusCode,400);
      assert.deepEqual((await admin.query('SELECT so_luong FROM san_pham_bien_the ORDER BY ma_bien_the'))[0].map(r=>r.so_luong),[3,4]);
      const wrong = await invoke(previewCheckout,{user:user(1),query:{source:'buy_now',ma_san_pham:'1',ma_bien_the:'999',so_luong:'1'}});
      assert.equal(wrong.statusCode,409);
    });


    await t.test('actual order procedures reject skipped states, deliver sequentially and restore canceled variants once',async()=>{
      await reset();
      const {updateTrangThaiDonHang}=await import('../dist/controllers/donHang.controller.js');
      const order=await invoke(createDonHang,{user:user(1),body:await direct()});const id=order.body.data.ma_don_hang;
      const set=state=>invoke(updateTrangThaiDonHang,{params:{id},body:{trang_thai:state}});
      assert.equal((await set('DaGiao')).statusCode,409);
      assert.equal((await set('DaXacNhan')).statusCode,200);
      assert.equal((await invoke(cancelDonHang,{user:user(1),params:{id}})).statusCode,400);
      assert.equal((await set('DangGiao')).statusCode,200);assert.equal((await set('DaGiao')).statusCode,200);
      assert.equal((await set('DaHuy')).statusCode,409);assert.equal(await stock(),9);
      await reset();
      await admin.query("DELETE FROM chi_tiet_gio_hang; INSERT INTO san_pham_bien_the (ma_bien_the,ma_san_pham,ma_sku,ten_bien_the,gia_ban,so_luong) VALUES (101,1,'TEST-A','A',120000,3)");
      const selection={source:'buy_now',ma_san_pham:1,ma_bien_the:101,so_luong:1};
      const quote=(await invoke(previewCheckout,{user:user(1),query:selection})).body.data;
      const created=await invoke(createDonHang,{user:user(1),body:{...await payload(),...selection,snapshot:quote.snapshot}});
      const variantOrder=created.body.data.ma_don_hang;
      for(const state of ['DaXacNhan','DangGiao','DaHuy'])assert.equal((await invoke(updateTrangThaiDonHang,{params:{id:variantOrder},body:{trang_thai:state}})).statusCode,200);
      assert.equal((await invoke(updateTrangThaiDonHang,{params:{id:variantOrder},body:{trang_thai:'DaHuy'}})).statusCode,409);
      assert.equal(await stock(),10);assert.equal((await admin.query('SELECT so_luong FROM san_pham_bien_the WHERE ma_bien_the=101'))[0][0].so_luong,3);
    });

    await t.test('concurrent variant orders cannot oversell', async () => {
      await reset();
      await admin.query("INSERT INTO san_pham_bien_the (ma_bien_the,ma_san_pham,ma_sku,ten_bien_the,gia_ban,so_luong) VALUES (101,1,'TEST-A','A',120000,1)");
      const selection={source:'buy_now',ma_san_pham:1,ma_bien_the:101,so_luong:1};
      const quote=(await invoke(previewCheckout,{user:user(1),query:{source:'buy_now',ma_san_pham:'1',ma_bien_the:'101',so_luong:'1'}})).body.data;
      const base={ho_ten_nguoi_nhan:'Test Customer',so_dien_thoai:'0912345678',dia_chi_giao_hang:'12 Nguyen Trai, Ha Noi',phuong_thuc_thanh_toan:'ThanhToanKhiNhanHang',snapshot:quote.snapshot,...selection};
      const results=await Promise.all([1,2].map(id=>invoke(createDonHang,{user:user(id),body:{...base,request_id:`variant_concurrent_${id}`}})));
      assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
      assert.equal((await admin.query('SELECT so_luong FROM san_pham_bien_the WHERE ma_bien_the=101'))[0][0].so_luong,0);
    });

    await t.test('voucher last-use reservation is atomic and retries do not spend it twice', async () => {
      await reset();
      await admin.query("INSERT INTO voucher (ma_code,giam_tien,don_toi_thieu,so_luot,bat_dau,ket_thuc) VALUES ('LOCAL20',20000,50000,1,NOW()-INTERVAL 1 DAY,NOW()+INTERVAL 1 DAY)");
      const selection={source:'buy_now',ma_san_pham:1,so_luong:1,ma_code:'LOCAL20'};
      const quote=(await invoke(previewCheckout,{user:user(1),query:{...selection,ma_san_pham:'1',so_luong:'1'}})).body.data;
      assert.equal(quote.tong_tien,80000);
      const base={ho_ten_nguoi_nhan:'Test Customer',so_dien_thoai:'0912345678',dia_chi_giao_hang:'12 Nguyen Trai, Ha Noi',phuong_thuc_thanh_toan:'ThanhToanKhiNhanHang',snapshot:quote.snapshot,...selection};
      const results=await Promise.all([1,2].map(id=>invoke(createDonHang,{user:user(id),body:{...base,request_id:`voucher_concurrent_${id}`}})));
      assert.deepEqual(results.map(r=>r.statusCode).sort(),[200,409]);
      const winner=results.findIndex(r=>r.statusCode===200)+1;
      const retry=await invoke(createDonHang,{user:user(winner),body:{...base,request_id:`voucher_concurrent_${winner}`}});
      assert.equal(retry.statusCode,200);
      assert.equal((await admin.query("SELECT da_dung FROM voucher WHERE ma_code='LOCAL20'"))[0][0].da_dung,1);
      assert.equal(await count('don_hang'),1);
      const orderId = retry.body.data.ma_don_hang;
      const { getDonHangById, listDonHang } = await import('../dist/services/donHang.service.js');
      await admin.query("UPDATE voucher SET ma_code='RENAMED20',giam_tien=5000 WHERE ma_code='LOCAL20'");
      const saved = (await getDonHangById(orderId)).order[0];
      assert.equal(saved.ma_code,'LOCAL20');
      assert.equal(Number(saved.giam_gia),20000);
      assert.equal(Number(saved.tam_tinh),100000);
      assert.equal(Number(saved.tong_tien),80000);
      assert.equal(Number(saved.phi_giao_hang),0);
      assert.equal((await listDonHang(winner,false)).orders.find(row=>row.ma_don_hang===orderId).ma_code,'LOCAL20');
      const changed=await invoke(createDonHang,{user:user(winner),body:{...base,request_id:`voucher_concurrent_${winner}`,ma_code:'OTHER'}});
      assert.equal(changed.statusCode,409);
    });

    await t.test('address and notification routes enforce ownership and staff permissions', async () => {
      const {default:express}=await import('express');
      const {default:shopRouter}=await import('../dist/routes/shop.routes.js');
      const {signToken}=await import('../dist/utils/jwt.js');
      const app=express();app.use(express.json());app.use('/shop',shopRouter);
      const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
      const url=`http://127.0.0.1:${server.address().port}/shop`;
      const request=async(path,accountId=1,method='GET',body)=>{
        const r=await fetch(url+path,{method,headers:{Authorization:`Bearer ${signToken({ma_tai_khoan:accountId,ten_dang_nhap:'test',vai_tro:'KhachHang'})}`,'Content-Type':'application/json'},...(body ? {body:JSON.stringify(body)} : {})});
        return {status:r.status,body:await r.json()};
      };
      try {
        const address={ho_ten:'Test Customer',so_dien_thoai:'0912345678',dia_chi:'12 Nguyen Trai, Ha Noi',mac_dinh:true};
        assert.equal((await request('/addresses',1,'POST',address)).status,200);
        const addressId=(await request('/addresses')).body.data[0].ma_dia_chi;
        assert.equal((await request(`/addresses/${addressId}`,2,'PUT',address)).status,404);
        await request(`/addresses/${addressId}`,2,'DELETE');
        assert.equal((await request('/addresses')).body.data.length,1);
        const notifications=(await request('/notifications',1)).body.data;
        assert.ok(notifications.length>0);
        await request(`/notifications/${notifications[0].ma_thong_bao}/read`,2,'PUT');
        assert.equal((await admin.query('SELECT da_doc FROM thong_bao WHERE ma_thong_bao=?',[notifications[0].ma_thong_bao]))[0][0].da_doc,0);
        assert.equal((await request('/vouchers',1)).status,403);
        assert.equal((await request('/inventory',1)).status,403);
      }finally{await new Promise(resolve=>server.close(resolve));}
    });

    await t.test('buy-now purchases only the chosen quantity and preserves the existing cart', async () => {
      await reset(); const body = await direct(1, 3);
      const [before] = await admin.query('SELECT * FROM chi_tiet_gio_hang');
      const results = await Promise.all([1, 2].map(() => invoke(createDonHang, { user: user(1), body })));
      assert.deepEqual(results.map(r => r.statusCode), [200, 200]);
      assert.equal(results[0].body.data.ma_don_hang, results[1].body.data.ma_don_hang);
      assert.equal(results[0].body.data.tong_tien, 300000);
      assert.equal(await stock(), 7); assert.equal(await count('don_hang'), 1);
      const [after] = await admin.query('SELECT * FROM chi_tiet_gio_hang'); assert.deepEqual(after, before);
      assert.equal((await invoke(createDonHang, { user: user(1), body: { ...body, source: 'cart', ma_san_pham: undefined, so_luong: undefined } })).statusCode, 409);
    });
    await t.test('buy-now works without a cart, rejects stale prices, unavailable products and deleted products', async () => {
      await reset(); await admin.query('DELETE FROM gio_hang WHERE ma_tai_khoan = 2');
      const body = await direct(2, 1);
      assert.equal((await invoke(createDonHang, { user: user(2), body })).statusCode, 200);
      assert.equal(await count('gio_hang'), 1);
      await admin.query('INSERT INTO gio_hang (ma_gio_hang, ma_tai_khoan) VALUES (2, 2)');
      for (const sql of ["UPDATE san_pham SET gia_ban = 120000", "UPDATE san_pham SET trang_thai = 'NgungBan'", 'UPDATE san_pham SET so_luong = 0']) {
        await reset(); const attempt = await direct(); await admin.query(sql);
        assert.equal((await invoke(createDonHang, { user: user(1), body: attempt })).statusCode, 409);
        assert.equal(await count('don_hang'), 0); assert.equal(await count('chi_tiet_gio_hang'), 1);
      }
      assert.equal((await invoke(previewCheckout, { user: user(1), query: { source: 'buy_now', ma_san_pham: 99999, so_luong: 1 } })).statusCode, 404);
    });
    await t.test('buy-now and cart checkout compete safely for the last stock', async () => {
      await reset(); await admin.query('UPDATE san_pham SET so_luong = 2');
      const directBody = await direct(2, 2), cartBody = await payload(1);
      const results = await Promise.all([invoke(createDonHang, { user: user(2), body: directBody }), invoke(createDonHang, { user: user(1), body: cartBody })]);
      assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 409]);
      assert.equal(await stock(), 0); assert.equal(await count('don_hang'), 1);
    });

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
      await reset(); await admin.query('UPDATE san_pham SET so_luong = 1; UPDATE chi_tiet_gio_hang SET so_luong = 1; INSERT INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,so_luong) VALUES (2, 1, 1)');
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
