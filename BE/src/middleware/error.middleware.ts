import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response.js';

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, `Route không tồn tại: ${req.originalUrl}`);
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled error:', err);
  return sendError(res, 500, 'Lỗi máy chủ nội bộ', [err.message]);
}
