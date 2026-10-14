import { listVouchers, createVoucher, setVoucherActive, customerVouchers, grantVoucherToUser, claimVoucherByCode } from '../services/voucher.service.js';
import { voucherCode } from '../services/pricing.service.js';
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

router.post('/my-vouchers/claim', run(async (req, res) => {
  const code = voucherCode(req.body.ma_code);
  const result = await claimVoucherByCode(req.user!.ma_tai_khoan, code);
  return sendSuccess(res, result.message, result.data);
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

router.post('/vouchers/grant', authorizePermission('vouchers'), run(async (req, res) => {
  const identifier = String(req.body.tai_khoan || req.body.identifier || '').trim();
  const voucherId = req.body.ma_voucher ? id(req.body.ma_voucher) : null;
  const voucherCodeInput = req.body.ma_code ? String(req.body.ma_code).trim().toUpperCase() : null;
  const expiryDays = Number(req.body.so_ngay_hieu_luc || 30);

  if (!identifier) {
    throw new CheckoutError(400, 'Vui lòng nhập số điện thoại hoặc tên đăng nhập của khách hàng.');
  }

  // 1. Tìm tài khoản theo SĐT hoặc tên đăng nhập
  const [userRows] = await pool.query(
    'SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, so_dien_thoai, vai_tro FROM tai_khoan WHERE so_dien_thoai = ? OR ten_dang_nhap = ? LIMIT 1',
    [identifier, identifier]
  );
  const targetUser = (userRows as any[])[0];
  if (!targetUser) {
    throw new CheckoutError(404, `Không tìm thấy tài khoản với thông tin "${identifier}". Vui lòng kiểm tra lại số điện thoại hoặc tên đăng nhập.`);
  }

  // 2. Tìm voucher
  let voucherQuery = 'SELECT * FROM voucher WHERE ';
  const voucherParams: any[] = [];
  if (voucherId) {
    voucherQuery += 'ma_voucher = ?';
    voucherParams.push(voucherId);
  } else if (voucherCodeInput) {
    voucherQuery += 'ma_code = ?';
    voucherParams.push(voucherCodeInput);
  } else {
    throw new CheckoutError(400, 'Vui lòng chọn hoặc nhập mã giảm giá cần kích hoạt.');
  }

  const [vRows] = await pool.query(voucherQuery, voucherParams);
  const voucher = (vRows as any[])[0];
  if (!voucher) {
    throw new CheckoutError(404, 'Mã giảm giá không tồn tại.');
  }

  // 3. Kích hoạt voucher vào ví của tài khoản đó
  await grantVoucherToUser(pool, targetUser.ma_tai_khoan, voucher.ma_code, 'AdminCapRieng', expiryDays);

  return sendSuccess(res, `Đã kích hoạt thành công voucher ${voucher.ma_code} cho khách hàng ${targetUser.ho_ten || targetUser.ten_dang_nhap} (${targetUser.so_dien_thoai || targetUser.ten_dang_nhap})!`, {
    ma_tai_khoan: targetUser.ma_tai_khoan,
    ho_ten: targetUser.ho_ten,
    ten_dang_nhap: targetUser.ten_dang_nhap,
    so_dien_thoai: targetUser.so_dien_thoai,
    ma_voucher: voucher.ma_voucher,
    ma_code: voucher.ma_code,
  });
}));

router.get('/vouchers/lookup-user', authorizePermission('vouchers'), run(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) throw new CheckoutError(400, 'Vui lòng nhập từ khóa tìm kiếm.');

  const [rows] = await pool.query(
    `SELECT ma_tai_khoan, ten_dang_nhap, ho_ten, so_dien_thoai, email, diem_thuong
     FROM tai_khoan
     WHERE (so_dien_thoai = ? OR ten_dang_nhap = ?)
        OR (so_dien_thoai LIKE ? OR ten_dang_nhap LIKE ? OR ho_ten LIKE ?)
     LIMIT 5`,
    [query, query, `%${query}%`, `%${query}%`, `%${query}%`]
  );
  return sendSuccess(res, 'Kết quả tìm kiếm khách hàng', rows);
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

  const employeeId = req.query.employee_id ? Number(req.query.employee_id) : null;
  const statusFilter = req.query.status && typeof req.query.status === 'string' && req.query.status !== 'all' ? req.query.status : null;
  const keyword = req.query.search && typeof req.query.search === 'string' && req.query.search.trim() ? `%${req.query.search.trim()}%` : null;

  // Filter clauses
  let salesWhere = "1=1";
  const salesArgs: any[] = [];
  if (from) { salesWhere += " AND dh.ngay_dat >= ?"; salesArgs.push(from); }
  if (to) { salesWhere += " AND dh.ngay_dat < DATE_ADD(?, INTERVAL 1 DAY)"; salesArgs.push(to); }
  if (employeeId) { salesWhere += " AND dh.ma_nhan_vien = ?"; salesArgs.push(employeeId); }
  if (statusFilter) { salesWhere += " AND dh.trang_thai = ?"; salesArgs.push(statusFilter); }
  if (keyword) {
    salesWhere += " AND (CAST(dh.ma_don_hang AS CHAR) LIKE ? OR sp.ten_san_pham LIKE ? OR nv.ho_ten LIKE ? OR dh.ho_ten_nguoi_nhan LIKE ? OR dh.so_dien_thoai LIKE ?)";
    salesArgs.push(keyword, keyword, keyword, keyword, keyword);
  }

  let purchaseWhere = "1=1";
  const purchaseArgs: any[] = [];
  if (from) { purchaseWhere += " AND nk.ngay_nhap >= ?"; purchaseArgs.push(from); }
  if (to) { purchaseWhere += " AND nk.ngay_nhap < DATE_ADD(?, INTERVAL 1 DAY)"; purchaseArgs.push(to); }
  if (employeeId) {
    purchaseWhere += " AND (nv.ma_nhan_vien = ? OR tk.ma_tai_khoan = (SELECT ma_tai_khoan FROM nhan_vien WHERE ma_nhan_vien = ?))";
    purchaseArgs.push(employeeId, employeeId);
  }
  if (keyword) {
    purchaseWhere += " AND (CAST(nk.ma_nhap AS CHAR) LIKE ? OR sp.ten_san_pham LIKE ? OR COALESCE(nv.ho_ten, tk.ho_ten) LIKE ? OR nk.nha_cung_cap LIKE ? OR nk.ghi_chu LIKE ?)";
    purchaseArgs.push(keyword, keyword, keyword, keyword, keyword);
  }

  // 1. Sales Details
  const [salesDetails] = await pool.query(`
    SELECT 
      ct.ma_don_hang,
      dh.ngay_dat,
      dh.trang_thai,
      dh.phuong_thuc_thanh_toan,
      dh.tong_tien AS tong_tien_don,
      dh.giam_gia AS giam_gia_don,
      dh.phi_giao_hang AS phi_giao_hang_don,
      dh.ma_code AS voucher_code,
      dh.ho_ten_nguoi_nhan,
      dh.so_dien_thoai,
      dh.dia_chi_giao_hang,
      dh.ma_nhan_vien,
      nv.ho_ten AS ten_nhan_vien,
      nv.chuc_vu AS chuc_vu_nhan_vien,
      ct.ma_san_pham,
      sp.ten_san_pham,
      ct.ma_bien_the,
      COALESCE(ct.ten_bien_the, bt.ten_bien_the) AS ten_bien_the,
      ct.so_luong,
      COALESCE(bt.so_luong, sp.so_luong, 0) AS so_luong_ton,
      ct.don_gia,
      ct.thanh_tien,
      COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0) AS gia_nhap,
      (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS tien_von,
      (ct.thanh_tien - (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0))) AS loi_nhuan
    FROM chi_tiet_don_hang ct
    JOIN don_hang dh ON dh.ma_don_hang = ct.ma_don_hang
    LEFT JOIN nhan_vien nv ON nv.ma_nhan_vien = dh.ma_nhan_vien
    JOIN san_pham sp ON sp.ma_san_pham = ct.ma_san_pham
    LEFT JOIN san_pham_bien_the bt ON bt.ma_bien_the = ct.ma_bien_the
    WHERE ${salesWhere}
    ORDER BY dh.ngay_dat DESC, ct.ma_don_hang DESC
    LIMIT 2000
  `, salesArgs);

  // 2. Purchase Details
  const [purchaseDetails] = await pool.query(`
    SELECT 
      nk.ma_nhap,
      nk.ngay_nhap,
      nk.ma_tai_khoan,
      tk.ho_ten AS ten_nguoi_nhap,
      nv.ma_nhan_vien,
      COALESCE(nv.ho_ten, tk.ho_ten) AS ten_nhan_vien,
      COALESCE(nv.chuc_vu, 'Nhân viên kho') AS chuc_vu_nhan_vien,
      nk.nha_cung_cap,
      nk.ma_san_pham,
      sp.ten_san_pham,
      nk.ma_bien_the,
      bt.ten_bien_the,
      nk.so_luong,
      COALESCE(nk.gia_nhap, sp.gia_nhap, sp.gia_ban * 0.75, 0) AS gia_nhap,
      (nk.so_luong * COALESCE(nk.gia_nhap, sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS thanh_tien,
      nk.ghi_chu
    FROM nhap_kho nk
    JOIN tai_khoan tk ON tk.ma_tai_khoan = nk.ma_tai_khoan
    LEFT JOIN nhan_vien nv ON nv.ma_tai_khoan = tk.ma_tai_khoan
    JOIN san_pham sp ON sp.ma_san_pham = nk.ma_san_pham
    LEFT JOIN san_pham_bien_the bt ON bt.ma_bien_the = nk.ma_bien_the
    WHERE ${purchaseWhere}
    ORDER BY nk.ngay_nhap DESC, nk.ma_nhap DESC
    LIMIT 2000
  `, purchaseArgs);

  // Base filter for delivered orders (for accurate revenue/profit metrics)
  const deliveredWhere = "dh.trang_thai = 'DaGiao'" + (from ? " AND dh.ngay_dat >= ?" : "") + (to ? " AND dh.ngay_dat < DATE_ADD(?, INTERVAL 1 DAY)" : "");
  const deliveredArgs = [from, to].filter(Boolean);

  // 3. Staff Sales Report
  const [staffSalesReport] = await pool.query(`
    SELECT 
      nv.ma_nhan_vien,
      nv.ho_ten AS ten_nhan_vien,
      nv.chuc_vu,
      nv.email,
      nv.so_dien_thoai,
      COUNT(DISTINCT dh.ma_don_hang) AS so_don,
      SUM(ct.so_luong) AS so_san_pham,
      SUM(ct.thanh_tien) AS doanh_thu,
      SUM(ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS gia_von,
      SUM(ct.thanh_tien - (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0))) AS loi_nhuan
    FROM don_hang dh
    JOIN nhan_vien nv ON nv.ma_nhan_vien = dh.ma_nhan_vien
    JOIN chi_tiet_don_hang ct ON ct.ma_don_hang = dh.ma_don_hang
    JOIN san_pham sp ON sp.ma_san_pham = ct.ma_san_pham
    WHERE ${deliveredWhere}
    GROUP BY nv.ma_nhan_vien, nv.ho_ten, nv.chuc_vu, nv.email, nv.so_dien_thoai
    ORDER BY doanh_thu DESC
  `, deliveredArgs);

  // 4. Staff Purchase Report
  const staffPurchaseWhere = "1=1" + (from ? " AND nk.ngay_nhap >= ?" : "") + (to ? " AND nk.ngay_nhap < DATE_ADD(?, INTERVAL 1 DAY)" : "");
  const staffPurchaseArgs = [from, to].filter(Boolean);
  const [staffPurchaseReport] = await pool.query(`
    SELECT 
      tk.ma_tai_khoan,
      nv.ma_nhan_vien,
      COALESCE(nv.ho_ten, tk.ho_ten) AS ten_nhan_vien,
      COALESCE(nv.chuc_vu, 'Nhân viên kho') AS chuc_vu,
      COUNT(nk.ma_nhap) AS so_lan_nhap,
      SUM(nk.so_luong) AS tong_so_luong,
      SUM(nk.so_luong * COALESCE(nk.gia_nhap, sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS tong_tien_nhap
    FROM nhap_kho nk
    JOIN tai_khoan tk ON tk.ma_tai_khoan = nk.ma_tai_khoan
    LEFT JOIN nhan_vien nv ON nv.ma_tai_khoan = tk.ma_tai_khoan
    JOIN san_pham sp ON sp.ma_san_pham = nk.ma_san_pham
    WHERE ${staffPurchaseWhere}
    GROUP BY tk.ma_tai_khoan, nv.ma_nhan_vien, ten_nhan_vien, chuc_vu
    ORDER BY tong_tien_nhap DESC
  `, staffPurchaseArgs);

  // 5. Category Sales Breakdown
  const [categorySales] = await pool.query(`
    SELECT 
      dm.ma_danh_muc,
      dm.ten_danh_muc,
      COUNT(DISTINCT dh.ma_don_hang) AS so_don,
      SUM(ct.so_luong) AS so_luong_ban,
      SUM(ct.thanh_tien) AS doanh_thu,
      SUM(ct.thanh_tien - (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0))) AS loi_nhuan
    FROM chi_tiet_don_hang ct
    JOIN don_hang dh ON dh.ma_don_hang = ct.ma_don_hang
    JOIN san_pham sp ON sp.ma_san_pham = ct.ma_san_pham
    JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
    WHERE ${deliveredWhere}
    GROUP BY dm.ma_danh_muc, dm.ten_danh_muc
    ORDER BY doanh_thu DESC
  `, deliveredArgs);

  // 6. Monthly trends
  const [monthlySales] = await pool.query(`
    SELECT 
      DATE_FORMAT(dh.ngay_dat, '%Y-%m') AS thang,
      COUNT(DISTINCT dh.ma_don_hang) AS so_don,
      SUM(dh.tong_tien) AS doanh_thu,
      SUM(ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS gia_von,
      SUM(ct.thanh_tien - (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0))) AS loi_nhuan
    FROM don_hang dh
    JOIN chi_tiet_don_hang ct ON ct.ma_don_hang = dh.ma_don_hang
    JOIN san_pham sp ON sp.ma_san_pham = ct.ma_san_pham
    WHERE ${deliveredWhere}
    GROUP BY thang
    ORDER BY thang
  `, deliveredArgs);

  const [monthlyPurchase] = await pool.query(`
    SELECT 
      DATE_FORMAT(nk.ngay_nhap, '%Y-%m') AS thang,
      COUNT(nk.ma_nhap) AS so_luot_nhap,
      SUM(nk.so_luong * COALESCE(nk.gia_nhap, sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS chi_nhap_kho
    FROM nhap_kho nk
    JOIN san_pham sp ON sp.ma_san_pham = nk.ma_san_pham
    WHERE ${staffPurchaseWhere}
    GROUP BY thang
    ORDER BY thang
  `, staffPurchaseArgs);

  const monthlyMap = new Map<string, any>();
  for (const m of monthlySales as any[]) {
    monthlyMap.set(m.thang, {
      thang: m.thang,
      so_don: Number(m.so_don || 0),
      doanh_thu: Number(m.doanh_thu || 0),
      gia_von: Number(m.gia_von || 0),
      loi_nhuan: Number(m.loi_nhuan || 0),
      chi_nhap_kho: 0,
      so_luot_nhap: 0,
    });
  }
  for (const p of monthlyPurchase as any[]) {
    if (!monthlyMap.has(p.thang)) {
      monthlyMap.set(p.thang, {
        thang: p.thang,
        so_don: 0,
        doanh_thu: 0,
        gia_von: 0,
        loi_nhuan: 0,
        chi_nhap_kho: Number(p.chi_nhap_kho || 0),
        so_luot_nhap: Number(p.so_luot_nhap || 0),
      });
    } else {
      const existing = monthlyMap.get(p.thang);
      existing.chi_nhap_kho = Number(p.chi_nhap_kho || 0);
      existing.so_luot_nhap = Number(p.so_luot_nhap || 0);
    }
  }
  const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.thang.localeCompare(b.thang));

  // 7. Bestsellers & Low Stock
  const [bestsellers] = await pool.query(`
    SELECT 
      ct.ma_san_pham,
      sp.ten_san_pham,
      SUM(ct.so_luong) AS da_ban,
      SUM(ct.thanh_tien) AS tien_hang,
      SUM(ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0)) AS tien_von,
      SUM(ct.thanh_tien - (ct.so_luong * COALESCE(sp.gia_nhap, sp.gia_ban * 0.75, 0))) AS loi_nhuan
    FROM chi_tiet_don_hang ct
    JOIN don_hang dh USING(ma_don_hang)
    JOIN san_pham sp USING(ma_san_pham)
    WHERE ${deliveredWhere}
    GROUP BY ct.ma_san_pham, sp.ten_san_pham
    ORDER BY da_ban DESC
    LIMIT 20
  `, deliveredArgs);

  const [lowStock] = await pool.query(`
    SELECT sp.ma_san_pham, sp.ten_san_pham, NULL AS ten_bien_the, sp.so_luong FROM san_pham sp WHERE sp.so_luong<=5 AND sp.trang_thai<>'NgungBan' AND NOT EXISTS (SELECT 1 FROM san_pham_bien_the bt WHERE bt.ma_san_pham=sp.ma_san_pham)
    UNION ALL SELECT sp.ma_san_pham, sp.ten_san_pham, bt.ten_bien_the, bt.so_luong FROM san_pham_bien_the bt JOIN san_pham sp USING(ma_san_pham) WHERE bt.so_luong<=5 AND bt.trang_thai<>'NgungBan' AND sp.trang_thai<>'NgungBan'
  `);

  // 8. Staff List
  const [staffList] = await pool.query(`
    SELECT ma_nhan_vien, ho_ten, chuc_vu FROM nhan_vien WHERE trang_thai = 'DangLam' ORDER BY ho_ten
  `);

  // 9. Financial Summary
  const totalRevenue = monthly.reduce((acc, row) => acc + row.doanh_thu, 0);
  const totalCost = monthly.reduce((acc, row) => acc + row.gia_von, 0);
  const totalProfit = monthly.reduce((acc, row) => acc + row.loi_nhuan, 0);
  const totalOrders = monthly.reduce((acc, row) => acc + row.so_don, 0);
  const totalPurchaseCost = monthly.reduce((acc, row) => acc + row.chi_nhap_kho, 0);
  const totalPurchaseCount = monthly.reduce((acc, row) => acc + row.so_luot_nhap, 0);
  const totalSoldItems = (salesDetails as any[]).filter(s => s.trang_thai === 'DaGiao').reduce((acc, s) => acc + Number(s.so_luong || 0), 0);
  const totalImportedItems = (purchaseDetails as any[]).reduce((acc, p) => acc + Number(p.so_luong || 0), 0);

  const summary = {
    tong_doanh_thu: totalRevenue,
    tong_gia_von: totalCost,
    loi_nhuan_gop: totalProfit,
    ty_suat_loi_nhuan: totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0,
    tong_don_hang: totalOrders,
    tong_san_pham_ban: totalSoldItems,
    tong_chi_nhap_kho: totalPurchaseCost,
    tong_luot_nhap: totalPurchaseCount,
    tong_san_pham_nhap: totalImportedItems,
  };

  return sendSuccess(res,'Báo cáo quản trị bán hàng & nhập hàng',{
    summary,
    monthly,
    sales_details: salesDetails,
    purchase_details: purchaseDetails,
    staff_sales_report: staffSalesReport,
    staff_purchase_report: staffPurchaseReport,
    category_sales: categorySales,
    bestsellers,
    low_stock: lowStock,
    staff_list: staffList,
  });
}));
router.get('/inventory',authorizePermission('inventory'),run(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT n.*,sp.ten_san_pham,bt.ten_bien_the,tk.ho_ten,nv.ma_nhan_vien,nv.chuc_vu FROM nhap_kho n JOIN san_pham sp USING(ma_san_pham)
    LEFT JOIN san_pham_bien_the bt ON bt.ma_bien_the=n.ma_bien_the JOIN tai_khoan tk ON tk.ma_tai_khoan=n.ma_tai_khoan LEFT JOIN nhan_vien nv ON nv.ma_tai_khoan=tk.ma_tai_khoan ORDER BY ma_nhap DESC LIMIT 500`);
  return sendSuccess(res,'Lịch sử nhập kho',rows);
}));
router.post('/inventory',authorizePermission('inventory'),run(async(req,res)=>{
  const productId=id(req.body.ma_san_pham), variantId=req.body.ma_bien_the ? id(req.body.ma_bien_the) : null, quantity=id(req.body.so_luong);
  if (quantity>1e6) throw new CheckoutError(400,'Số lượng nhập quá lớn.');
  const note=req.body.ghi_chu ? text(req.body.ghi_chu,1,500) : null;
  const costPrice = req.body.gia_nhap !== undefined && req.body.gia_nhap !== '' ? Number(req.body.gia_nhap) : null;
  const vendor = req.body.nha_cung_cap ? text(req.body.nha_cung_cap,1,150) : null;
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    const product=await resolveItem(connection,productId,variantId,true);
    if (product.ton_kho+quantity>2147483647) throw new CheckoutError(400,'Tồn kho vượt giới hạn.');
    await connection.execute('INSERT INTO nhap_kho (ma_san_pham,ma_bien_the,ma_tai_khoan,so_luong,ghi_chu,gia_nhap,nha_cung_cap) VALUES (?,?,?,?,?,?,?)',[productId,variantId,req.user!.ma_tai_khoan,quantity,note,costPrice ?? (product as any).gia_nhap ?? Math.round(Number(product.gia_ban) * 0.75),vendor ?? 'Nhà phân phối chính hãng']);
    await connection.execute(variantId ? 'UPDATE san_pham_bien_the SET so_luong=so_luong+? WHERE ma_bien_the=?' : 'UPDATE san_pham SET so_luong=so_luong+? WHERE ma_san_pham=?',[quantity,variantId || productId]);
    await connection.commit();
    return sendSuccess(res,'Đã nhập kho',null);
  } catch(error){await connection.rollback();throw error;} finally{connection.release();}
}));

router.get('/rewards/status', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const [userRows] = await pool.query('SELECT diem_thuong, ma_gioi_thieu, ma_nguoi_gioi_thieu FROM tai_khoan WHERE ma_tai_khoan = ?', [userId]);
  const user = (userRows as any[])[0] || { diem_thuong: 0, ma_gioi_thieu: null, ma_nguoi_gioi_thieu: null };

  const [todayRows] = await pool.query('SELECT 1 FROM lich_su_diem_danh WHERE ma_tai_khoan = ? AND ngay_diem_danh = CURDATE()', [userId]);
  const daDiemDanh = (todayRows as any[]).length > 0;

  const [streakRows] = await pool.query('SELECT chuoi_ngay, ngay_diem_danh FROM lich_su_diem_danh WHERE ma_tai_khoan = ? ORDER BY ngay_diem_danh DESC LIMIT 1', [userId]);
  let currentStreak = 0;
  if ((streakRows as any[]).length > 0) {
    const lastCheckin = (streakRows as any[])[0];
    const lastDate = new Date(lastCheckin.ngay_diem_danh).toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      currentStreak = Number(lastCheckin.chuoi_ngay || 0);
    }
  }

  const [recentRows] = await pool.query('SELECT ngay_diem_danh FROM lich_su_diem_danh WHERE ma_tai_khoan = ? AND ngay_diem_danh >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) ORDER BY ngay_diem_danh', [userId]);
  const recentDates = (recentRows as any[]).map(r => new Date(r.ngay_diem_danh).toISOString().slice(0, 10));

  const [claimedRows] = await pool.query('SELECT moc_ngay FROM lich_su_moc_diem_danh WHERE ma_tai_khoan = ? AND ngay_nhan >= DATE_SUB(NOW(), INTERVAL 30 DAY)', [userId]);
  const claimedMilestones = (claimedRows as any[]).map(r => Number(r.moc_ngay));

  const [refCountRows] = await pool.query('SELECT COUNT(*) as cnt, COALESCE(SUM(diem_thuong), 0) as total_pts FROM lich_su_gioi_thieu WHERE ma_nguoi_moi = ?', [userId]);
  const refCount = Number((refCountRows as any[])[0]?.cnt || 0);
  const totalRefPts = Number((refCountRows as any[])[0]?.total_pts || 0);

  const exchangeVouchers = [
    { code: 'FREESHIP15K', title: 'Voucher Miễn phí vận chuyển 15K', giam_tien: 15000, don_toi_thieu: 150000, xu_can: 200 },
    { code: 'REWARD20K', title: 'Voucher Giảm 20.000đ', giam_tien: 20000, don_toi_thieu: 100000, xu_can: 300 },
    { code: 'REWARD50K', title: 'Voucher Giảm 50.000đ', giam_tien: 50000, don_toi_thieu: 250000, xu_can: 600 },
    { code: 'REWARD100K', title: 'Voucher Giảm 100.000đ', giam_tien: 100000, don_toi_thieu: 500000, xu_can: 1000 },
  ];

  return sendSuccess(res, 'Trạng thái điểm thưởng', {
    diem_thuong: Number(user.diem_thuong || 0),
    ma_gioi_thieu: user.ma_gioi_thieu,
    da_nhap_ma_moi: user.ma_nguoi_gioi_thieu !== null,
    so_ban_be_da_moi: refCount,
    tong_thuong_gioi_thieu: totalRefPts,
    da_diem_danh_hom_nay: daDiemDanh,
    chuoi_ngay: currentStreak,
    lich_su_diem_danh_tuan: recentDates,
    lich_su_diem_danh_30_ngay: recentDates,
    mocs_da_nhan: claimedMilestones,
    vouchers_doi_thuong: exchangeVouchers,
  });
}));

router.post('/rewards/checkin', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [todayCheck] = await connection.query('SELECT 1 FROM lich_su_diem_danh WHERE ma_tai_khoan = ? AND ngay_diem_danh = CURDATE() FOR UPDATE', [userId]);
    if ((todayCheck as any[]).length > 0) {
      throw new CheckoutError(400, 'Bạn đã điểm danh hôm nay rồi. Hãy quay lại vào ngày mai nhé!');
    }

    const [lastRows] = await connection.query('SELECT ngay_diem_danh, chuoi_ngay FROM lich_su_diem_danh WHERE ma_tai_khoan = ? ORDER BY ngay_diem_danh DESC LIMIT 1', [userId]);
    let newStreak = 1;
    if ((lastRows as any[]).length > 0) {
      const last = (lastRows as any[])[0];
      const lastDate = new Date(last.ngay_diem_danh).toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastDate === yesterdayStr) {
        newStreak = Number(last.chuoi_ngay || 0) + 1;
      }
    }

    let basePoints = 100;
    let bonusPoints = 0;
    let giftNote = 'Điểm danh hàng ngày';

    if (newStreak % 30 === 0) {
      bonusPoints = 1000;
      giftNote = `Đạt mốc 30 ngày liên tiếp: Tặng 1000 Xu & Siêu Voucher 100K (CHECKIN30D)!`;
      await grantVoucherToUser(connection, userId, 'CHECKIN30D', 'DiemDanh30Ngay', 30);
      try { await connection.execute('INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, 30, ?, ?)', [userId, giftNote, newStreak]); } catch {}
    } else if (newStreak % 21 === 0) {
      bonusPoints = 700;
      giftNote = `Đạt mốc 21 ngày liên tiếp: Tặng 700 Xu & Voucher 70K (CHECKIN21D)!`;
      await grantVoucherToUser(connection, userId, 'CHECKIN21D', 'DiemDanh21Ngay', 30);
      try { await connection.execute('INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, 21, ?, ?)', [userId, giftNote, newStreak]); } catch {}
    } else if (newStreak % 14 === 0) {
      bonusPoints = 500;
      giftNote = `Đạt mốc 14 ngày liên tiếp: Tặng 500 Xu & Voucher 50K (CHECKIN14D)!`;
      await grantVoucherToUser(connection, userId, 'CHECKIN14D', 'DiemDanh14Ngay', 30);
      try { await connection.execute('INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, 14, ?, ?)', [userId, giftNote, newStreak]); } catch {}
    } else if (newStreak % 7 === 0) {
      bonusPoints = 300;
      giftNote = `Đạt mốc 7 ngày liên tiếp: Tặng 300 Xu & Voucher 30K (CHECKIN7D)!`;
      await grantVoucherToUser(connection, userId, 'CHECKIN7D', 'DiemDanh7Ngay', 30);
      try { await connection.execute('INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, 7, ?, ?)', [userId, giftNote, newStreak]); } catch {}
    } else if (newStreak % 3 === 0) {
      bonusPoints = 100;
      giftNote = `Đạt mốc 3 ngày liên tiếp: Thưởng thêm 100 Xu!`;
      try { await connection.execute('INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, 3, ?, ?)', [userId, giftNote, newStreak]); } catch {}
    }

    const totalPointsGained = basePoints + bonusPoints;

    await connection.execute(
      'INSERT INTO lich_su_diem_danh (ma_tai_khoan, ngay_diem_danh, diem_cong, chuoi_ngay, qua_tang) VALUES (?, CURDATE(), ?, ?, ?)',
      [userId, totalPointsGained, newStreak, giftNote]
    );

    await connection.execute(
      'UPDATE tai_khoan SET diem_thuong = diem_thuong + ? WHERE ma_tai_khoan = ?',
      [totalPointsGained, userId]
    );

    const [userRows] = await connection.query('SELECT diem_thuong FROM tai_khoan WHERE ma_tai_khoan = ?', [userId]);
    const currentTotalPoints = (userRows as any[])[0]?.diem_thuong || 0;

    await connection.commit();
    return sendSuccess(res, 'Điểm danh thành công!', {
      diem_cong: totalPointsGained,
      chuoi_ngay: newStreak,
      qua_tang: giftNote,
      tong_diem_hien_tai: currentTotalPoints,
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

router.post('/rewards/claim-milestone', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const moc = Number(req.body.moc_ngay);
  const validMilestones = [3, 7, 14, 21, 30];
  if (!validMilestones.includes(moc)) {
    throw new CheckoutError(400, 'Mốc quà tặng không hợp lệ.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [streakRows] = await connection.query(
      'SELECT chuoi_ngay, ngay_diem_danh FROM lich_su_diem_danh WHERE ma_tai_khoan = ? ORDER BY ngay_diem_danh DESC LIMIT 1',
      [userId]
    );
    let currentStreak = 0;
    if ((streakRows as any[]).length > 0) {
      const lastCheckin = (streakRows as any[])[0];
      const lastDate = new Date(lastCheckin.ngay_diem_danh).toISOString().slice(0, 10);
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastDate === todayStr || lastDate === yesterdayStr) {
        currentStreak = Number(lastCheckin.chuoi_ngay || 0);
      }
    }

    if (currentStreak < moc) {
      throw new CheckoutError(400, `Bạn cần chuỗi điểm danh tối thiểu ${moc} ngày để nhận quà này (Hiện tại: ${currentStreak} ngày).`);
    }

    const [claimed] = await connection.query(
      'SELECT 1 FROM lich_su_moc_diem_danh WHERE ma_tai_khoan = ? AND moc_ngay = ? AND ngay_nhan >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [userId, moc]
    );
    if ((claimed as any[]).length > 0) {
      throw new CheckoutError(400, `Bạn đã nhận phần quà mốc ${moc} ngày rồi.`);
    }

    let bonusXu = 0;
    let voucherCodeToGrant: string | null = null;
    let giftDescription = '';

    if (moc === 3) {
      bonusXu = 100;
      giftDescription = 'Thưởng +100 Xu chuỗi 3 ngày';
    } else if (moc === 7) {
      bonusXu = 300;
      voucherCodeToGrant = 'CHECKIN7D';
      giftDescription = 'Voucher 30.000đ (CHECKIN7D) + 300 Xu';
    } else if (moc === 14) {
      bonusXu = 500;
      voucherCodeToGrant = 'CHECKIN14D';
      giftDescription = 'Voucher 50.000đ (CHECKIN14D) + 500 Xu';
    } else if (moc === 21) {
      bonusXu = 700;
      voucherCodeToGrant = 'CHECKIN21D';
      giftDescription = 'Voucher 70.000đ (CHECKIN21D) + 700 Xu';
    } else if (moc === 30) {
      bonusXu = 1000;
      voucherCodeToGrant = 'CHECKIN30D';
      giftDescription = 'Siêu Voucher 100.000đ (CHECKIN30D) + 1.000 Xu';
    }

    if (bonusXu > 0) {
      await connection.execute('UPDATE tai_khoan SET diem_thuong = diem_thuong + ? WHERE ma_tai_khoan = ?', [bonusXu, userId]);
    }
    if (voucherCodeToGrant) {
      await grantVoucherToUser(connection, userId, voucherCodeToGrant, `MocDiemDanh${moc}Ngay`, 30);
    }

    await connection.execute(
      'INSERT INTO lich_su_moc_diem_danh (ma_tai_khoan, moc_ngay, phan_thuong, chuoi_tai_thoi_diem) VALUES (?, ?, ?, ?)',
      [userId, moc, giftDescription, currentStreak]
    );

    const [userRows] = await connection.query('SELECT diem_thuong FROM tai_khoan WHERE ma_tai_khoan = ?', [userId]);
    const currentTotalPoints = (userRows as any[])[0]?.diem_thuong || 0;

    await connection.commit();
    return sendSuccess(res, `Chúc mừng bạn đã nhận thành công: ${giftDescription}!`, {
      moc_ngay: moc,
      phan_thuong: giftDescription,
      diem_cong: bonusXu,
      voucher: voucherCodeToGrant,
      tong_diem_hien_tai: currentTotalPoints,
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

router.post('/rewards/referral', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const rawCode = req.body.referral_code || req.body.ma_gioi_thieu;
  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
    throw new CheckoutError(400, 'Vui lòng nhập mã giới thiệu.');
  }
  const code = rawCode.trim().toUpperCase();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query('SELECT ma_gioi_thieu, ma_nguoi_gioi_thieu FROM tai_khoan WHERE ma_tai_khoan = ? FOR UPDATE', [userId]);
    const currentUser = (userRows as any[])[0];
    if (currentUser?.ma_nguoi_gioi_thieu) {
      throw new CheckoutError(400, 'Bạn đã nhập mã giới thiệu trước đây rồi. Mỗi tài khoản chỉ được nhập 1 lần.');
    }
    if (currentUser?.ma_gioi_thieu === code) {
      throw new CheckoutError(400, 'Bạn không thể tự nhập mã giới thiệu của chính mình.');
    }

    const [inviterRows] = await connection.query('SELECT ma_tai_khoan, ho_ten FROM tai_khoan WHERE ma_gioi_thieu = ?', [code]);
    if (!(inviterRows as any[]).length) {
      throw new CheckoutError(404, 'Mã giới thiệu không tồn tại hoặc không hợp lệ.');
    }
    const inviter = (inviterRows as any[])[0];

    await connection.execute('UPDATE tai_khoan SET ma_nguoi_gioi_thieu = ?, diem_thuong = diem_thuong + 500 WHERE ma_tai_khoan = ?', [inviter.ma_tai_khoan, userId]);
    await connection.execute('UPDATE tai_khoan SET diem_thuong = diem_thuong + 500 WHERE ma_tai_khoan = ?', [inviter.ma_tai_khoan]);

    await connection.execute(
      'INSERT INTO lich_su_gioi_thieu (ma_nguoi_moi, ma_nguoi_duoc_moi, diem_thuong) VALUES (?, ?, 500)',
      [inviter.ma_tai_khoan, userId]
    );

    await grantVoucherToUser(connection, userId, 'NEWBIE50K', 'TanThuGioiThieu', 30);

    await connection.commit();
    return sendSuccess(res, `Chúc mừng bạn đã kết nối với ${inviter.ho_ten}! Bạn nhận được +500 Xu và Voucher tân thủ NEWBIE50K (đã thêm vào ví).`, {
      nguoi_gioi_thieu: inviter.ho_ten,
      diem_nhan: 500,
      voucher_tan_thu: 'NEWBIE50K',
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

router.post('/rewards/exchange', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const rewardCode = req.body.reward_code;
  const voucherCosts: Record<string, { cost: number; title: string }> = {
    FREESHIP15K: { cost: 200, title: 'Voucher Miễn phí vận chuyển 15K' },
    REWARD20K: { cost: 300, title: 'Voucher Giảm 20.000đ' },
    REWARD50K: { cost: 600, title: 'Voucher Giảm 50.000đ' },
    REWARD100K: { cost: 1000, title: 'Voucher Giảm 100.000đ' },
  };

  const selected = voucherCosts[rewardCode];
  if (!selected) {
    throw new CheckoutError(400, 'Gói đổi thưởng không hợp lệ.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userRows] = await connection.query('SELECT diem_thuong FROM tai_khoan WHERE ma_tai_khoan = ? FOR UPDATE', [userId]);
    const pts = Number((userRows as any[])[0]?.diem_thuong || 0);
    if (pts < selected.cost) {
      throw new CheckoutError(400, `Bạn cần tối thiểu ${selected.cost} Xu để đổi voucher này (Hiện có: ${pts} Xu). Hãy điểm danh thêm nhé!`);
    }

    await connection.execute('UPDATE tai_khoan SET diem_thuong = diem_thuong - ? WHERE ma_tai_khoan = ?', [selected.cost, userId]);
    await grantVoucherToUser(connection, userId, rewardCode, 'DoiXu', 30);
    await connection.commit();

    return sendSuccess(res, `Đổi thành công ${selected.title}! Voucher đã được lưu vào ví của bạn, sẵn sàng sử dụng khi thanh toán.`, {
      ma_code: rewardCode,
      xu_tru: selected.cost,
      xu_con_lai: pts - selected.cost,
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

router.post('/rewards/spin', run(async (req, res) => {
  const userId = req.user!.ma_tai_khoan;
  const spinCost = 100;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userRows] = await connection.query('SELECT diem_thuong FROM tai_khoan WHERE ma_tai_khoan = ? FOR UPDATE', [userId]);
    const pts = Number((userRows as any[])[0]?.diem_thuong || 0);
    if (pts < spinCost) {
      throw new CheckoutError(400, `Bạn cần tối thiểu ${spinCost} Xu để quay vòng quay may mắn (Hiện có: ${pts} Xu).`);
    }

    const prizes = [
      { text: '+200 Xu Thưởng', points: 200, voucher: null, weight: 25 },
      { text: 'Voucher Giảm 20K (REWARD20K)', points: 0, voucher: 'REWARD20K', weight: 20 },
      { text: '+100 Xu (Hòa vốn)', points: 100, voucher: null, weight: 25 },
      { text: 'Freeship 15K (FREESHIP15K)', points: 0, voucher: 'FREESHIP15K', weight: 15 },
      { text: 'Voucher 50K (REWARD50K)', points: 0, voucher: 'REWARD50K', weight: 10 },
      { text: 'Jackpot +500 Xu', points: 500, voucher: null, weight: 5 },
    ];

    const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let wonPrize = prizes[0];
    for (const p of prizes) {
      if (randomNum < p.weight) {
        wonPrize = p;
        break;
      }
      randomNum -= p.weight;
    }

    const netPoints = wonPrize.points - spinCost;
    await connection.execute('UPDATE tai_khoan SET diem_thuong = diem_thuong + ? WHERE ma_tai_khoan = ?', [netPoints, userId]);
    if (wonPrize.voucher) {
      await grantVoucherToUser(connection, userId, wonPrize.voucher, 'VongQuayMayMan', 30);
    }
    await connection.commit();

    return sendSuccess(res, `Chúc mừng bạn đã trúng: ${wonPrize.text}!`, {
      prize: wonPrize.text,
      points_won: wonPrize.points,
      voucher_won: wonPrize.voucher,
      xu_con_lai: pts + netPoints,
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));
export default router;
