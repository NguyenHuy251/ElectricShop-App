import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistration } from '../utils/registration.ts';

const form = { ten_dang_nhap: 'demo_user', mat_khau: 'Password123', ho_ten: 'Demo User', email: 'demo@example.test', so_dien_thoai: '', dia_chi: '' };

test('registration normalizes pasted details and phone without changing the password', () => {
  const { value, errors } = validateRegistration({ ...form, ten_dang_nhap: ' demo_user ', email: ' demo@example.test ', so_dien_thoai: '+84 912 345 678', mat_khau: ' Password123 ' });
  assert.deepEqual(errors, {});
  assert.equal(value.ten_dang_nhap, 'demo_user');
  assert.equal(value.email, 'demo@example.test');
  assert.equal(value.so_dien_thoai, '0912345678');
  assert.equal(value.mat_khau, ' Password123 ');
});

test('registration explains invalid required fields before sending an API request', () => {
  const { errors } = validateRegistration({ ...form, ten_dang_nhap: 'x', mat_khau: '123456', ho_ten: ' ', email: 'invalid', so_dien_thoai: '123' });
  assert.deepEqual(Object.keys(errors), ['ten_dang_nhap', 'mat_khau', 'ho_ten', 'email', 'so_dien_thoai']);
});

test('registration enforces bcrypt UTF-8 byte limit and accepts empty optional details', () => {
  assert.deepEqual(validateRegistration(form).errors, {});
  assert.ok(validateRegistration({ ...form, mat_khau: '😀'.repeat(19) }).errors.mat_khau);
  assert.deepEqual(validateRegistration({ ...form, mat_khau: '😀'.repeat(18) }).errors, {});
});
