import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileStaff, isStoredMobileStaff } from '../utils/mobile-access.ts';

test('mobile blocks staff while preserving customer and admin access', () => {
  assert.equal(isMobileStaff({vai_tro:'NhanVien'}),true);
  assert.equal(isMobileStaff({vai_tro:'KhachHang'}),false);
  assert.equal(isMobileStaff({vai_tro:'Admin'}),false);
});
test('old stored staff sessions are detected, including malformed or missing cache', () => {
  assert.equal(isStoredMobileStaff(JSON.stringify({vai_tro:'NhanVien'})),true);
  assert.equal(isStoredMobileStaff(JSON.stringify({vai_tro:'KhachHang'})),false);
  for(const value of [null,'invalid','null','{}']) assert.equal(isStoredMobileStaff(value),false);
});
