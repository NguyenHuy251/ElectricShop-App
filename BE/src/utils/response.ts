import { Response } from 'express';

export function sendSuccess<T>(res: Response, message: string, data: T, pagination?: unknown) {
  return res.status(200).json({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function sendError(res: Response, statusCode: number, message: string, errors: string[] = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
