export const mobileStaffMessage = 'Tài khoản nhân viên chỉ được sử dụng trên web admin, không được truy cập ứng dụng mobile.';
export function isMobileStaff(user: { vai_tro?: string } | null | undefined) {
  return user?.vai_tro === 'NhanVien';
}
export function isStoredMobileStaff(value: string | null) {
  if (!value) return false;
  try { return isMobileStaff(JSON.parse(value)); } catch { return false; }
}
