import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: {
    ma_tai_khoan: number;
    ten_dang_nhap: string;
    vai_tro: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token không hợp lệ hoặc thiếu token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 401, 'Token không hợp lệ hoặc đã hết hạn');
  }
}
