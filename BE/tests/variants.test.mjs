import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVariantGroup } from '../dist/controllers/bienThe.controller.js';
const group = { ten_thuoc_tinh: ' Kích thước ', variants: [{ ma_san_pham: 1, gia_tri: '55 inch' }, { ma_san_pham: 2, gia_tri: '65 inch' }, { ma_san_pham: 3, gia_tri: '75 inch' }] };
test('normalizes three sizes and allows removing an existing group', () => {
  assert.equal(validateVariantGroup(1, group).attribute, 'Kích thước');
  assert.deepEqual(validateVariantGroup(1, { variants: [] }).variants, []);
});
test('rejects duplicate products, case-insensitive labels and unrelated anchor', () => {
  assert.throws(() => validateVariantGroup(4, group));
  assert.throws(() => validateVariantGroup(1, { ...group, variants: [group.variants[0], group.variants[0]] }));
  assert.throws(() => validateVariantGroup(1, { ...group, variants: [group.variants[0], { ma_san_pham: 2, gia_tri: '55 INCH' }] }));
});
test('rejects invalid IDs, malformed rows, empty labels and excessive groups', () => {
  for (const body of [null, {}, { variants: {} }, { ...group, variants: [null, null] }, { ...group, variants: [{ ma_san_pham: '1', gia_tri: '55 inch' }, group.variants[1]] }, { ...group, ten_thuoc_tinh: ' ' }, { ...group, variants: [group.variants[0]] }, { ...group, variants: Array(21).fill(group.variants[0]) }]) assert.throws(() => validateVariantGroup(1, body));
});
