import { Router } from 'express';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { voucherCode } from '../services/voucher.service.js';
const router=Router();
router.use(authenticate);
router.get('/available', async(req,res)=>{try {
 const user=(req as import('../middleware/auth.middleware.js').AuthRequest).user!;
 const [rows]=await pool.query(`SELECT v.code, v.loai, v.gia_tri, v.don_toi_thieu, v.giam_toi_da, v.ket_thuc, ? AS can_use FROM voucher v
 WHERE v.hoat_dong=1 AND v.bat_dau<=NOW() AND v.ket_thuc>NOW()
 AND (SELECT COUNT(*) FROM voucher_su_dung s WHERE s.ma_voucher=v.ma_voucher AND s.hoan_luot=0)<v.gioi_han
 AND (SELECT COUNT(*) FROM voucher_su_dung s WHERE s.ma_voucher=v.ma_voucher AND s.ma_tai_khoan=? AND s.hoan_luot=0)<v.moi_khach
 ORDER BY v.ket_thuc LIMIT 30`,[user.vai_tro === 'KhachHang', user.ma_tai_khoan]);
 return sendSuccess(res,'Mã giảm giá dành cho bạn',rows);
 }catch{return sendError(res,500,'Không thể tải mã giảm giá');}});
router.use(authorize('Admin'));
router.get('/',async (_req,res)=>{try{const [rows]=await pool.query('SELECT v.*, (SELECT COUNT(*) FROM voucher_su_dung s WHERE s.ma_voucher = v.ma_voucher AND s.hoan_luot = 0) AS da_dung FROM voucher v ORDER BY ma_voucher DESC');return sendSuccess(res,'Danh sách mã giảm giá',rows);}catch{return sendError(res,500,'Không thể tải mã giảm giá');}});
router.get('/:id',async(req,res)=>{try{const [rows]=await pool.query('SELECT * FROM voucher WHERE ma_voucher = ?',[Number(req.params.id)]);const v=(rows as object[])[0];return v?sendSuccess(res,'Th?ng tin m?',v):sendError(res,404,'Kh?ng t?m th?y m?');}catch{return sendError(res,500,'Kh?ng th? t?i m?');}});
function validate(body:any) {
 const code=voucherCode(body.code);
 const ints=['gia_tri','don_toi_thieu','gioi_han','moi_khach'];
 if(!code || !['PhanTram','SoTien'].includes(body.loai) || ints.some(k=>!Number.isSafeInteger(body[k]) || body[k]<0) || body.gia_tri<1 || body.gioi_han<1 || body.moi_khach<1 || body.moi_khach>body.gioi_han || body.gia_tri>1000000000000 || body.don_toi_thieu>1000000000000) throw new Error('Kiểm tra loại giảm, giá trị, đơn tối thiểu và giới hạn lượt');
 if(body.loai==='PhanTram' && body.gia_tri>100) throw new Error('Phần trăm giảm phải từ 1 đến 100');
 const cap=body.giam_toi_da==null ? null : body.giam_toi_da;
 if((cap!==null && (!Number.isSafeInteger(cap)||cap<1||cap>1000000000000)) || (body.loai==='PhanTram' && cap===null)) throw new Error('Mã phần trăm phải có mức giảm tối đa hợp lệ');
 const start=new Date(body.bat_dau),end=new Date(body.ket_thuc);
 if(!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start>=end || typeof body.hoat_dong!=='boolean') throw new Error('Thời gian và trạng thái không hợp lệ');
 return [code,body.loai,body.gia_tri,body.don_toi_thieu,cap,start,end,body.gioi_han,body.moi_khach,body.hoat_dong];
}
router.post('/',async(req,res)=>{let values;try{values=validate(req.body);}catch(e){return sendError(res,400,(e as Error).message);}try{const [result]=await pool.execute('INSERT INTO voucher (code,loai,gia_tri,don_toi_thieu,giam_toi_da,bat_dau,ket_thuc,gioi_han,moi_khach,hoat_dong) VALUES (?,?,?,?,?,?,?,?,?,?)',values);return sendSuccess(res,'Đã tạo mã giảm giá',{ma_voucher:(result as {insertId:number}).insertId});}catch(e){return sendError(res,(e as {code:string}).code==='ER_DUP_ENTRY'?409:500,'Mã đã tồn tại hoặc không thể lưu');}});
router.put('/:id',async(req,res)=>{
 const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return sendError(res,400,'Mã không hợp lệ');
 let values;try{values=validate(req.body);}catch(e){return sendError(res,400,(e as Error).message);}
 const conn=await pool.getConnection();try{
 await conn.beginTransaction();const [rows]=await conn.query('SELECT * FROM voucher WHERE ma_voucher = ? FOR UPDATE',[id]);const current=(rows as Record<string,any>[])[0];if(!current){await conn.rollback();return sendError(res,404,'Không tìm thấy mã');}
 const [used]=await conn.query('SELECT COUNT(*) AS total FROM voucher_su_dung WHERE ma_voucher = ?',[id]);
 if(Number((used as {total:number}[])[0].total)>0){
 const keys=['code','loai','gia_tri','don_toi_thieu','giam_toi_da','bat_dau','ket_thuc','gioi_han','moi_khach'];
 const changed=keys.some((key,i)=> values[i] instanceof Date ? new Date(current[key]).getTime() !== (values[i] as Date).getTime() : String(current[key]??'') !== String(values[i]??'') && Number(current[key])!==Number(values[i]));
 if(changed){await conn.rollback();return sendError(res,409,'Mã đã có lịch sử sử dụng: chỉ được bật/tắt. Tạo mã mới để đổi điều kiện.');}
 await conn.execute('UPDATE voucher SET hoat_dong = ? WHERE ma_voucher = ?',[req.body.hoat_dong,id]);
 }else await conn.execute('UPDATE voucher SET code=?,loai=?,gia_tri=?,don_toi_thieu=?,giam_toi_da=?,bat_dau=?,ket_thuc=?,gioi_han=?,moi_khach=?,hoat_dong=? WHERE ma_voucher=?',[...values,id]);
 await conn.commit();return sendSuccess(res,'Đã cập nhật mã',{ma_voucher:id});
 }catch{await conn.rollback();return sendError(res,409,'Không thể cập nhật mã, kiểm tra mã trùng và thử lại');}finally{conn.release();}
});
export default router;
