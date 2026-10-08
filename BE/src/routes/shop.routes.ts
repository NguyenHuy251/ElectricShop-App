import { listVouchers,createVoucher,setVoucherActive,customerVouchers } from '../services/voucher.service.js';
import { Router, type RequestHandler, type Response } from 'express';
import { pool } from '../config/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { authorizePermission } from '../middleware/role.middleware.js';
import { CheckoutError } from '../utils/checkout.js';
import { resolveItem } from '../services/commerce.service.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();
router.use(authenticate);


const run = (fn: (req: AuthRequest, res: Response) => Promise<unknown>): RequestHandler => (req, res) => {
  void fn(req as AuthRequest, res).catch(error => {
    if (!(error instanceof CheckoutError)) console.error('Shop request failed:', error);
    sendError(res, error instanceof CheckoutError ? error.status : 503, error instanceof CheckoutError ? error.message : 'Chưa thể xử lý yêu cầu. Vui lòng thử lại.');
  });
};
const id = (value: unknown) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) throw new CheckoutError(400, 'Mã không hợp lệ.');
  return n;
};
const text = (value: unknown, min: number, max: number) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new CheckoutError(400, `Thông tin phải có ${min}–${max} ký tự.`);
  return value.trim();
};

router.get('/addresses', run(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM dia_chi_giao_hang WHERE ma_tai_khoan = ? ORDER BY mac_dinh DESC, ma_dia_chi DESC', [req.user!.ma_tai_khoan]);
  return sendSuccess(res, 'Sổ địa chỉ', rows);
}));
const saveAddress = run(async (req, res) => {
  const name = text(req.body.ho_ten,2,100), phone = text(req.body.so_dien_thoai,10,15).replace(/^\+84/,'0'), address = text(req.body.dia_chi,10,255);
  if (!/^0[35789]\d{8}$/.test(phone)) throw new CheckoutError(400, 'Số điện thoại không hợp lệ.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Account lock serializes default-address changes, including the first address.
    await connection.query('SELECT ma_tai_khoan FROM tai_khoan WHERE ma_tai_khoan = ? FOR UPDATE',[req.user!.ma_tai_khoan]);
    if (req.params.id) {
      const [rows] = await connection.query('SELECT ma_dia_chi FROM dia_chi_giao_hang WHERE ma_dia_chi = ? AND ma_tai_khoan = ?', [id(req.params.id),req.user!.ma_tai_khoan]);
      if (!(rows as unknown[]).length) throw new CheckoutError(404,'Địa chỉ không tồn tại.');
    }
    const [existing] = await connection.query('SELECT ma_dia_chi FROM dia_chi_giao_hang WHERE ma_tai_khoan = ?',[req.user!.ma_tai_khoan]);
    if (!req.params.id && (existing as unknown[]).length >= 20) throw new CheckoutError(409, 'Tối đa 20 địa chỉ.');
    const isDefault = req.body.mac_dinh === true || !(existing as unknown[]).length;
    if (isDefault) await connection.execute('UPDATE dia_chi_giao_hang SET mac_dinh = FALSE WHERE ma_tai_khoan = ?',[req.user!.ma_tai_khoan]);
    if (req.params.id) await connection.execute('UPDATE dia_chi_giao_hang SET ho_ten=?,so_dien_thoai=?,dia_chi=?,mac_dinh=? WHERE ma_dia_chi=? AND ma_tai_khoan=?',[name,phone,address,isDefault,id(req.params.id),req.user!.ma_tai_khoan]);
    else await connection.execute('INSERT INTO dia_chi_giao_hang (ma_tai_khoan,ho_ten,so_dien_thoai,dia_chi,mac_dinh) VALUES (?,?,?,?,?)',[req.user!.ma_tai_khoan,name,phone,address,isDefault]);
    await connection.commit();
    return sendSuccess(res,'Đã lưu địa chỉ',null);
  } catch (error) {await connection.rollback();throw error;} finally {connection.release();}
});
router.post('/addresses',saveAddress);
router.put('/addresses/:id',saveAddress);
router.delete('/addresses/:id',run(async(req,res)=>{
  await pool.execute('DELETE FROM dia_chi_giao_hang WHERE ma_dia_chi=? AND ma_tai_khoan=?',[id(req.params.id),req.user!.ma_tai_khoan]);
  return sendSuccess(res,'Đã xóa địa chỉ',null);
}));

router.get('/notifications', run(async(req,res)=>{
  const [rows]=await pool.query('SELECT * FROM thong_bao WHERE ma_tai_khoan=? ORDER BY ma_thong_bao DESC LIMIT 100',[req.user!.ma_tai_khoan]);
  return sendSuccess(res,'Thông báo',rows);
}));
router.put('/notifications/:id/read',run(async(req,res)=>{
  await pool.execute('UPDATE thong_bao SET da_doc=TRUE WHERE ma_thong_bao=? AND ma_tai_khoan=?',[id(req.params.id),req.user!.ma_tai_khoan]);
  return sendSuccess(res,'Đã đọc',null);
}));

router.get('/my-vouchers',run(async(req,res)=>{
  const subtotal = req.query.tam_tinh === undefined ? undefined : Number(req.query.tam_tinh);
  if (subtotal !== undefined && (typeof req.query.tam_tinh !== 'string' || !Number.isFinite(subtotal) || subtotal < 0 || subtotal > 1e15)) throw new CheckoutError(400,'Tổng tiền hàng không hợp lệ.');
  return sendSuccess(res,'Voucher của tôi',await customerVouchers(req.user!.ma_tai_khoan,subtotal));
}));
router.get('/vouchers',authorizePermission('vouchers'),run(async(_req,res)=>{
  const rows=await listVouchers();
  return sendSuccess(res,'Mã giảm giá',rows);
}));
router.post('/vouchers',authorizePermission('vouchers'),run(async(req,res)=>{
  const code=text(req.body.ma_code,3,40).toUpperCase();
  const amount=Number(req.body.giam_tien), minimum=Number(req.body.don_toi_thieu || 0), uses=Number(req.body.so_luot);
  const start=new Date(req.body.bat_dau), end=new Date(req.body.ket_thuc);
  if (!/^[A-Z0-9_-]+$/.test(code) || !Number.isFinite(amount) || amount<=0 || amount>1e9 || !Number.isFinite(minimum) || minimum<0 || minimum>1e12 || !Number.isSafeInteger(uses) || uses<1 || uses>1e6 || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end<=start) throw new CheckoutError(400,'Thông tin mã giảm giá không hợp lệ.');
  await createVoucher({ma_code:code,giam_tien:amount,don_toi_thieu:minimum,so_luot:uses,bat_dau:start,ket_thuc:end});
  return sendSuccess(res,'Đã tạo mã giảm giá',null);
}));
router.put('/vouchers/:id',authorizePermission('vouchers'),run(async(req,res)=>{
  if (typeof req.body.trang_thai !== 'boolean') throw new CheckoutError(400,'Trạng thái không hợp lệ.');
  await setVoucherActive(id(req.params.id),req.body.trang_thai);
  return sendSuccess(res,'Đã cập nhật mã giảm giá',null);
}));

router.post('/orders/:id/reorder',run(async(req,res)=>{
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders]=await connection.query('SELECT ma_don_hang FROM don_hang WHERE ma_don_hang=? AND ma_tai_khoan=?',[id(req.params.id),req.user!.ma_tai_khoan]);
    if(!(orders as unknown[]).length)throw new CheckoutError(404,'Đơn hàng không tồn tại.');
    await connection.execute('INSERT INTO gio_hang (ma_tai_khoan) VALUES (?) ON DUPLICATE KEY UPDATE ma_tai_khoan=VALUES(ma_tai_khoan)',[req.user!.ma_tai_khoan]);
    const [carts]=await connection.query('SELECT ma_gio_hang FROM gio_hang WHERE ma_tai_khoan=? FOR UPDATE',[req.user!.ma_tai_khoan]);
    const cartId=(carts as {ma_gio_hang:number}[])[0].ma_gio_hang;
    const [lines]=await connection.query('SELECT ma_san_pham,ma_bien_the,so_luong FROM chi_tiet_don_hang WHERE ma_don_hang=? ORDER BY ma_san_pham,ma_bien_the',[id(req.params.id)]);
    for(const line of lines as {ma_san_pham:number;ma_bien_the:number|null;so_luong:number}[]){
      const item=await resolveItem(connection,line.ma_san_pham,line.ma_bien_the,true);
      const [existing]=await connection.query('SELECT so_luong FROM chi_tiet_gio_hang WHERE ma_gio_hang=? AND ma_san_pham=? AND ma_bien_the <=> ?',[cartId,line.ma_san_pham,line.ma_bien_the]);
      const quantity=line.so_luong+((existing as {so_luong:number}[])[0]?.so_luong || 0);
      if(item.trang_thai!=='DangBan' || quantity>item.ton_kho || quantity>999)throw new CheckoutError(409,`${item.ten_san_pham} không đủ tồn kho hoặc đã ngừng bán. Vui lòng chọn lại sản phẩm.`);
      await connection.execute('INSERT INTO chi_tiet_gio_hang (ma_gio_hang,ma_san_pham,ma_bien_the,so_luong) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE so_luong=VALUES(so_luong)',[cartId,line.ma_san_pham,line.ma_bien_the,quantity]);
    }
    await connection.commit();return sendSuccess(res,'Đã thêm sản phẩm vào giỏ theo giá hiện tại',null);
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}));
router.get('/reports',authorizePermission('reports'),run(async(req,res)=>{
  const date=(value:unknown)=>{
    if(value===undefined || value==='')return null;
    if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)throw new CheckoutError(400,'Ngày không hợp lệ.');
    return value;
  };
  const from=date(req.query.from),to=date(req.query.to);
  if(from && to && from>to)throw new CheckoutError(400,'Khoảng ngày không hợp lệ.');
  const where="dh.trang_thai='DaGiao' AND (? IS NULL OR dh.ngay_dat >= ?) AND (? IS NULL OR dh.ngay_dat < DATE_ADD(?,INTERVAL 1 DAY))";
  const args=[from,from,to,to];
  const [monthly]=await pool.query(`SELECT DATE_FORMAT(dh.ngay_dat,'%Y-%m') AS thang,COUNT(*) AS so_don,SUM(dh.tong_tien) AS doanh_thu FROM don_hang dh WHERE ${where} GROUP BY thang ORDER BY thang`,args);
  const [bestsellers]=await pool.query(`SELECT ct.ma_san_pham,sp.ten_san_pham,SUM(ct.so_luong) AS da_ban,SUM(ct.thanh_tien) AS tien_hang FROM chi_tiet_don_hang ct JOIN don_hang dh USING(ma_don_hang) JOIN san_pham sp USING(ma_san_pham) WHERE ${where} GROUP BY ct.ma_san_pham,sp.ten_san_pham ORDER BY da_ban DESC LIMIT 20`,args);
  const [lowStock]=await pool.query(`SELECT sp.ma_san_pham,sp.ten_san_pham,NULL AS ten_bien_the,sp.so_luong FROM san_pham sp WHERE sp.so_luong<=5 AND sp.trang_thai<>'NgungBan' AND NOT EXISTS (SELECT 1 FROM san_pham_bien_the bt WHERE bt.ma_san_pham=sp.ma_san_pham)
    UNION ALL SELECT sp.ma_san_pham,sp.ten_san_pham,bt.ten_bien_the,bt.so_luong FROM san_pham_bien_the bt JOIN san_pham sp USING(ma_san_pham) WHERE bt.so_luong<=5 AND bt.trang_thai<>'NgungBan' AND sp.trang_thai<>'NgungBan'`);
  return sendSuccess(res,'Báo cáo bán hàng',{monthly,bestsellers,low_stock:lowStock});
}));
router.get('/inventory',authorizePermission('inventory'),run(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT n.*,sp.ten_san_pham,bt.ten_bien_the,tk.ho_ten FROM nhap_kho n JOIN san_pham sp USING(ma_san_pham)
    LEFT JOIN san_pham_bien_the bt ON bt.ma_bien_the=n.ma_bien_the JOIN tai_khoan tk ON tk.ma_tai_khoan=n.ma_tai_khoan ORDER BY ma_nhap DESC LIMIT 500`);
  return sendSuccess(res,'Lịch sử nhập kho',rows);
}));
router.post('/inventory',authorizePermission('inventory'),run(async(req,res)=>{
  const productId=id(req.body.ma_san_pham), variantId=req.body.ma_bien_the ? id(req.body.ma_bien_the) : null, quantity=id(req.body.so_luong);
  if (quantity>1e6) throw new CheckoutError(400,'Số lượng nhập quá lớn.');
  const note=req.body.ghi_chu ? text(req.body.ghi_chu,1,500) : null;
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const product=await resolveItem(connection,productId,variantId,true);
    if (product.ton_kho+quantity>2147483647) throw new CheckoutError(400,'Tồn kho vượt giới hạn.');
    await connection.execute('INSERT INTO nhap_kho (ma_san_pham,ma_bien_the,ma_tai_khoan,so_luong,ghi_chu) VALUES (?,?,?,?,?)',[productId,variantId,req.user!.ma_tai_khoan,quantity,note]);
    await connection.execute(variantId ? 'UPDATE san_pham_bien_the SET so_luong=so_luong+? WHERE ma_bien_the=?' : 'UPDATE san_pham SET so_luong=so_luong+? WHERE ma_san_pham=?',[quantity,variantId || productId]);
    await connection.commit();
    return sendSuccess(res,'Đã nhập kho',null);
  } catch(error){await connection.rollback();throw error;} finally{connection.release();}
}));
export default router;
