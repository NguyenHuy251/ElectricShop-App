export function validateForgotPassword(email: string, phone: string) {
  const value = { email: email.trim(), so_dien_thoai: phone.replace(/[\s().-]/g, '').replace(/^\+84/, '0') };
  const errors: { email?: string; so_dien_thoai?: string } = {};
  if (value.email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'Nhập đúng email đã đăng ký.';
  if (!/^0[35789]\d{8}$/.test(value.so_dien_thoai)) errors.so_dien_thoai = 'Nhập số điện thoại đã đăng ký, ví dụ 0912345678.';
  return { value, errors };
}
