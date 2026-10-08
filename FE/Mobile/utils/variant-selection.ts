import type { ProductVariant } from '../types';

export interface VariantAttributeGroup {
  key: string;
  name: string;
  unit?: string | null;
  choices: string[];
}

export const hasVariantStock = (variant: ProductVariant) => variant.trang_thai === 'DangBan' && Number(variant.so_luong) > 0;

export function getVariantAttrValue(variant: ProductVariant, key: string): string {
  if (key === 'variant_name') return variant.ten_bien_the.trim();
  if (!key.startsWith('spec_')) return '';
  const spec = variant.thong_so_ky_thuat?.find(item => item.ma_thong_so === Number(key.slice(5)));
  return String(spec?.gia_tri ?? spec?.gia_tri_so ?? '').trim();
}

export function variantsForSelectedColor(variants: ProductVariant[], selected: ProductVariant | undefined, colorGroup: VariantAttributeGroup | undefined) {
  const color = selected && colorGroup ? getVariantAttrValue(selected, colorGroup.key) : '';
  return color ? variants.filter(variant => getVariantAttrValue(variant, colorGroup!.key) === color) : variants;
}

export function choicesForSelectedColor(group: VariantAttributeGroup, variants: ProductVariant[], selected: ProductVariant | undefined, colorGroup: VariantAttributeGroup | undefined) {
  if (group.key === colorGroup?.key) return group.choices;
  const values = new Set(variantsForSelectedColor(variants, selected, colorGroup).map(variant => getVariantAttrValue(variant, group.key)));
  return group.choices.filter(choice => values.has(choice));
}

export function selectVariantChoice(variants: ProductVariant[], groups: VariantAttributeGroup[], selected: ProductVariant | undefined, colorGroup: VariantAttributeGroup | undefined, group: VariantAttributeGroup, choice: string) {
  // Color can always change. Every other choice stays within the selected color.
  const scope = group.key === colorGroup?.key ? variants : variantsForSelectedColor(variants, selected, colorGroup);
  const candidates = scope.filter(variant => hasVariantStock(variant) && getVariantAttrValue(variant, group.key) === choice);
  const score = (variant: ProductVariant) => groups.reduce((total, other) => {
    if (!selected || other.key === group.key || other.key === colorGroup?.key) return total;
    const value = getVariantAttrValue(selected, other.key);
    return total + (value && getVariantAttrValue(variant, other.key) === value ? 1 : 0);
  }, 0);
  // Retain compatible settings when changing color; otherwise select an available option.
  return [...candidates].sort((a, b) => score(b) - score(a) || Number(b.ma_bien_the === selected?.ma_bien_the) - Number(a.ma_bien_the === selected?.ma_bien_the))[0];
}
