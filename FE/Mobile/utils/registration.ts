export type RegistrationForm = {
  ten_dang_nhap: string;
  mat_khau: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  dia_chi: string;
};

export function validateRegistration(form: RegistrationForm) {
  const value = {
    ...form,
    ten_dang_nhap: form.ten_dang_nhap.trim(),
    ho_ten: form.ho_ten.trim(),
    email: form.email.trim(),
    so_dien_thoai: form.so_dien_thoai.replace(/[\s().-]/g, '').replace(/^\+84/, '0'),
    dia_chi: form.dia_chi.trim(),
  };
  const errors: Partial<Record<keyof RegistrationForm, string>> = {};
  if (!/^[A-Za-z0-9_.-]{3,50}$/.test(value.ten_dang_nhap)) errors.ten_dang_nhap = 'Nhập 3–50 ký tự: chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  const passwordBytes = Array.from(value.mat_khau).reduce((total, char) => {
    const point = char.codePointAt(0)!;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
  if (value.mat_khau.length < 8 || passwordBytes > 72) errors.mat_khau = 'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.';
  if (value.ho_ten.length < 2 || value.ho_ten.length > 100) errors.ho_ten = 'Nhập họ tên từ 2 đến 100 ký tự.';
  if (value.email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'Nhập email hợp lệ.';
  if (value.so_dien_thoai && !/^0[35789]\d{8}$/.test(value.so_dien_thoai)) errors.so_dien_thoai = 'Nhập số di động Việt Nam hợp lệ, ví dụ 0912345678.';
  if (value.dia_chi.length > 255) errors.dia_chi = 'Địa chỉ tối đa 255 ký tự.';
  return { value, errors };
}
