import 'dotenv/config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || JWT_SECRET.length < 32)) throw new Error('Production requires JWT_SECRET with at least 32 characters');

export interface JwtPayload {
  token_version?: number;
  ma_tai_khoan: number;
  ten_dang_nhap: string;
  vai_tro: string;
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
