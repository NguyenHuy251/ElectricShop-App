import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutSelection, validateCheckout, summarizeCart } from '../dist/utils/checkout.js';

const input = { ho_ten_nguoi_nhan: ' Nguyen Van A ', so_dien_thoai: '+84 912 345 678', dia_chi_giao_hang: '12 Nguyen Trai, Ha Noi', ghi_chu: '', phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang', request_id: 'checkout_test_12345678', snapshot: 'a'.repeat(64) };
test('buy-now selection rejects unknown modes and invalid product/quantity', () => {
  assert.deepEqual(checkoutSelection({}), {});
  assert.deepEqual(checkoutSelection({ source: 'buy_now', ma_san_pham: '3', so_luong: '2' }, true), { source: 'buy_now', ma_san_pham: 3, so_luong: 2 });
  for (const value of [{ source: 'other' }, { ma_san_pham: 1 }, { source: 'buy_now', ma_san_pham: -1, so_luong: 1 }, { source: 'buy_now', ma_san_pham: 1, so_luong: 0 }, { source: 'buy_now', ma_san_pham: 1, so_luong: 1.5 }, { source: 'buy_now', ma_san_pham: 1, so_luong: 1000 }, { source: 'buy_now', ma_san_pham: 1, so_luong: '2' }]) assert.throws(() => checkoutSelection(value), error => error.status === 400);
  assert.equal(validateCheckout({ ...input, source: 'buy_now', ma_san_pham: 2, so_luong: 3 }).source, 'buy_now');
});
test('checkout validates recipient, phone, address and COD on server', () => {
  const valid = validateCheckout(input);
  assert.equal(valid.ho_ten_nguoi_nhan, 'Nguyen Van A');
  assert.equal(valid.so_dien_thoai, '0912345678');
  for (const patch of [{ ho_ten_nguoi_nhan: ' ' }, { so_dien_thoai: '123' }, { dia_chi_giao_hang: 'x' }, { ghi_chu: 'x'.repeat(1001) }, { phuong_thuc_thanh_toan: 'ChuyenKhoan' }, { request_id: '' }, { snapshot: '' }]) {
    assert.throws(() => validateCheckout({ ...input, ...patch }), error => error.status === 400);
  }
});
test('quote detects unavailable products and price/quantity changes', () => {
  const item = { ma_san_pham: 1, ten_san_pham: 'Test', so_luong: 2, gia_ban: '100000.25', ton_kho: 3, trang_thai: 'DangBan' };
  const quote = summarizeCart([item]);
  assert.equal(quote.tong_tien, 200000.5);
  assert.equal(quote.phi_giao_hang, 0);
  assert.equal(quote.can_checkout, true);
  assert.equal(summarizeCart([]).can_checkout, false);
  for (const patch of [{ so_luong: 0 }, { so_luong: -1 }, { so_luong: 1.5 }, { ton_kho: 1 }, { trang_thai: 'NgungBan' }, { gia_ban: -5 }]) assert.equal(summarizeCart([{ ...item, ...patch }]).can_checkout, false);
  assert.notEqual(summarizeCart([{ ...item, gia_ban: '100001' }]).snapshot, quote.snapshot);
  assert.notEqual(summarizeCart([{ ...item, so_luong: 1 }]).snapshot, quote.snapshot);
});
