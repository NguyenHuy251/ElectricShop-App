import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../config/database.js';
import { signToken } from '../utils/jwt.js';
import { CheckoutError } from '../utils/checkout.js';

const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function issueSession(accountId:number,expectedPassword?:string,previousToken?:string){
  const connection=await pool.getConnection();
  try{
    await connection.beginTransaction();
    const [rows]=await connection.query('SELECT ma_tai_khoan,ten_dang_nhap,vai_tro,trang_thai,mat_khau,token_version FROM tai_khoan WHERE ma_tai_khoan=? FOR UPDATE',[accountId]);
    const user=(rows as {ma_tai_khoan:number;ten_dang_nhap:string;vai_tro:string;trang_thai:string;mat_khau:string;token_version:number}[])[0];
    if(!user || user.trang_thai!=='HoatDong' || (expectedPassword && expectedPassword!==user.mat_khau))throw new CheckoutError(401,'Phiên đăng nhập không hợp lệ.');
    if(previousToken){
      const [sessions]=await connection.query('SELECT token_version FROM auth_sessions WHERE token_hash=? AND ma_tai_khoan=? AND expires_at>NOW() FOR UPDATE',[hash(previousToken),accountId]);
      if(!(sessions as {token_version:number}[])[0] || (sessions as {token_version:number}[])[0].token_version!==user.token_version)throw new CheckoutError(401,'Phiên đăng nhập đã hết hạn.');
      await connection.execute('DELETE FROM auth_sessions WHERE token_hash=?',[hash(previousToken)]);
    }
    const refreshToken=randomBytes(32).toString('hex');
    await connection.execute('DELETE FROM auth_sessions WHERE ma_tai_khoan=? AND expires_at<=NOW()',[accountId]);
    await connection.execute('INSERT INTO auth_sessions (token_hash,ma_tai_khoan,token_version,expires_at) VALUES (?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY))',[hash(refreshToken),accountId,user.token_version]);
    const token=signToken({ma_tai_khoan:user.ma_tai_khoan,ten_dang_nhap:user.ten_dang_nhap,vai_tro:user.vai_tro,token_version:user.token_version});
    await connection.commit();return {token,refresh_token:refreshToken};
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
export async function refreshSession(token:unknown){
  if(typeof token!=='string' || !/^[a-f0-9]{64}$/.test(token))throw new CheckoutError(401,'Refresh token không hợp lệ.');
  const [rows]=await pool.query('SELECT ma_tai_khoan FROM auth_sessions WHERE token_hash=?',[hash(token)]);
  const session=(rows as {ma_tai_khoan:number}[])[0];
  if(!session)throw new CheckoutError(401,'Phiên đăng nhập đã hết hạn.');
  return issueSession(session.ma_tai_khoan,undefined,token);
}
export async function revokeSession(token:unknown){
  if(typeof token==='string' && /^[a-f0-9]{64}$/.test(token))await pool.execute('DELETE FROM auth_sessions WHERE token_hash=?',[hash(token)]);
}
