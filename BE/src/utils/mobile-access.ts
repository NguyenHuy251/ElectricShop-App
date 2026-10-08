import type { Request, Response } from 'express';

export const mobileStaffMessage = 'Tài khoản nhân viên chỉ được sử dụng trên web admin, không được truy cập ứng dụng mobile.';
export const isMobileRequest = (req: Request) => req.headers['x-client-platform'] === 'mobile';
export function rejectMobileStaff(res: Response) {
  return res.status(403).json({ success: false, code: 'MOBILE_STAFF_FORBIDDEN', message: mobileStaffMessage });
}
