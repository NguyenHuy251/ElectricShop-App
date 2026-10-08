import test from 'node:test';
import assert from 'node:assert/strict';
import { validateForgotPassword } from '../utils/forgot-password.ts';

test('recovery validates both required identity fields', () => {
  for (const [email,phone] of [['',''],['invalid','0912345678'],['a@example.com','123'],['a@example.com','']]) {
    assert.ok(Object.keys(validateForgotPassword(email,phone).errors).length>0);
  }
});
test('recovery normalizes pasted email and Vietnamese international phone format', () => {
  const result = validateForgotPassword(' user@example.com ','+84 912.345.678');
  assert.deepEqual(result.value,{email:'user@example.com',so_dien_thoai:'0912345678'});
  assert.deepEqual(result.errors,{});
});
