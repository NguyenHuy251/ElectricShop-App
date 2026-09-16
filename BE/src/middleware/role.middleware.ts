import { NextFunction, Response } from 'express';
import { sendError } from '../utils/response.js';
import { AuthRequest } from './auth.middleware.js';

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'Bạn chưa đăng nhập');
    }

    if (!allowedRoles.includes(req.user.vai_tro)) {
      return sendError(res, 403, 'Bạn không có quyền truy cập chức năng này');
    }

    next();
  };
}
