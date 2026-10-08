import test from 'node:test';
import assert from 'node:assert/strict';
import { choicesForSelectedColor, selectVariantChoice } from '../utils/variant-selection.ts';

const color = { key: 'spec_1', name: 'Màu sắc', choices: ['Đỏ', 'Đen'] };
const power = { key: 'spec_10', name: 'Công suất', choices: ['100', '200', '300'] };
const capacity = { key: 'spec_6', name: 'Dung tích', choices: ['1', '2'] };
const groups = [color, power, capacity];
const variant = (id, c, p, volume = '1', stock = 5) => ({
  ma_bien_the: id, ten_bien_the: `${c} ${p}W`, trang_thai: 'DangBan', so_luong: stock,
  thong_so_ky_thuat: [{ ma_thong_so: 1, gia_tri: c }, { ma_thong_so: 10, gia_tri_so: Number(p) }, { ma_thong_so: 6, gia_tri: volume }],
});
const variants = [variant(1, 'Đỏ', '100'), variant(2, 'Đỏ', '200', '2'), variant(3, 'Đen', '300'), variant(4, 'Đỏ', '300', '2', 0)];

test('secondary options show only values belonging to the selected color', () => {
  assert.deepEqual(choicesForSelectedColor(power, variants, variants[2], color), ['300']);
  assert.deepEqual(choicesForSelectedColor(capacity, variants, variants[2], color), ['1']);
  assert.deepEqual(choicesForSelectedColor(color, variants, variants[2], color), ['Đỏ', 'Đen']);
});

test('changing color is allowed even when the current power is unavailable in that color', () => {
  const selected = selectVariantChoice(variants, groups, variants[1], color, color, 'Đen');
  assert.equal(selected.ma_bien_the, 3);
  assert.deepEqual(choicesForSelectedColor(power, variants, selected, color), ['300']);
});

test('power selection never switches color or selects an out-of-stock variant', () => {
  assert.equal(selectVariantChoice(variants, groups, variants[2], color, power, '100'), undefined);
  assert.equal(selectVariantChoice(variants, groups, variants[0], color, power, '300'), undefined);
  assert.equal(selectVariantChoice(variants, groups, variants[0], color, power, '200').ma_bien_the, 2);
});

test('changing color preserves compatible settings when an available combination exists', () => {
  const matching = [...variants, variant(5, 'Đen', '200', '2')];
  assert.equal(selectVariantChoice(matching, groups, variants[1], color, color, 'Đen').ma_bien_the, 5);
});

test('secondary selection remains usable with multiple dimensions and products without colors', () => {
  assert.equal(selectVariantChoice(variants, groups, variants[0], color, capacity, '2').ma_bien_the, 2);
  assert.deepEqual(choicesForSelectedColor(power, variants, variants[0], undefined), power.choices);
  assert.equal(selectVariantChoice(variants, [power], variants[0], undefined, power, '300').ma_bien_the, 3);
});
