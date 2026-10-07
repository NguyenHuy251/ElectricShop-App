import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductCard, ProductImage } from '@/components/shop-ui';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import type { GroupedSpecification, GroupedSpecificationItem, Product, ProductImage as IProductImage, ProductReview, ProductSpecification, ProductVariant } from '@/types';
import { formatCurrency, formatDate, getApiMessage } from '@/utils/format';

export default function ProductDetailScreen() {
  const { id, quantity } = useLocalSearchParams<{ id: string; quantity?: string }>();
  return <ProductDetail key={String(id)} id={id} initialQuantity={quantity} />;
}

interface VariantAttributeGroup {
  key: string;
  name: string;
  unit?: string | null;
  choices: string[];
}

function ProductDetail({ id, initialQuantity }: { id: string; initialQuantity?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(/^\d+$/.test(initialQuantity || '') && Number(initialQuantity) > 0 ? String(Math.min(999, Number(initialQuantity))) : '1');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [zoom, setZoom] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(5);
  const [related, setRelated] = useState<Product[]>([]);
  const [relatedError, setRelatedError] = useState('');
  const busy = useRef(false);
  const version = useRef(0);

  const loadReviews = useCallback(() => {
    setReviewLoading(true);
    setReviewError('');
    return productService.getReviews(Number(id)).then(result => setReviews(result.data || []))
      .catch(err => setReviewError(getApiMessage(err, 'Chưa tải được đánh giá.')))
      .finally(() => setReviewLoading(false));
  }, [id]);

  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
        setProduct(null); setLoadError('Mã sản phẩm không hợp lệ.'); return;
      }
      const { data } = await productService.getProductById(Number(id));
      if (current !== version.current) return;
      setProduct(data); setLoadError('');
      const vList: ProductVariant[] = data.variants || [];
      const inStock = vList.find((v: ProductVariant) => v.trang_thai === 'DangBan' && Number(v.so_luong) > 0) || vList[0];
      setSelectedVariantId(inStock ? inStock.ma_bien_the : null);
      setRelatedError('');

      // Determine primary image
      const imgList = data.images || data.danh_sach_hinh_anh || [];
      const primary = imgList.find((img: IProductImage) => img.la_anh_chinh) || imgList[0];
      setSelectedImageUri(primary?.duong_dan || data.hinh_anh || null);

      void productService.getProducts({ ma_danh_muc: data.ma_danh_muc, limit: 6 }).then(result => {
        if (current === version.current) setRelated((result.data as Product[]).filter(item => item.ma_san_pham !== data.ma_san_pham && item.trang_thai === 'DangBan' && Number(item.so_luong) > 0).slice(0, 4));
      }).catch(() => { if (current === version.current) setRelatedError('Chưa tải được sản phẩm cùng danh mục.'); });
      void loadReviews();
    } catch (err: any) {
      if (current === version.current) {
        setLoadError(getApiMessage(err, 'Không thể tải thông tin sản phẩm.'));
        setProduct(null);
      }
    } finally {
      if (current === version.current) { setLoading(false); setRefreshing(false); }
    }
  }, [id, loadReviews]);

  useFocusEffect(useCallback(() => {
    busy.current = false;
    void load();
    return () => { version.current++; };
  }, [load]));

  const count = Number(quantity);
  const variants = product?.variants || [];
  const selectedVariant: ProductVariant | undefined = variants.find(variant => variant.ma_bien_the === selectedVariantId) || (variants.length > 0 ? variants[0] : undefined);
  const displayPrice = selectedVariant?.gia_ban ?? product?.gia_ban;
  const displayStock = selectedVariant?.so_luong ?? product?.so_luong;
  const max = Math.min(999, Number(displayStock || 0));
  const available = product?.trang_thai === 'DangBan' && (!selectedVariant || selectedVariant.trang_thai === 'DangBan') && max > 0 && Number(displayPrice) > 0;
  const validQuantity = /^\d+$/.test(quantity) && Number.isInteger(count) && count >= 1 && count <= max;
  const canBuy = Boolean(available && validQuantity && !adding && !refreshing && !loadError);
  const changeQuantity = (value: string) => { setQuantity(value); setError(''); setNotice(''); };

  const addToCart = async () => {
    if (!product || !canBuy || busy.current) return;
    busy.current = true; setAdding(true); setError(''); setNotice('');
    try {
      await cartService.addToCart(product.ma_san_pham, count);
      setNotice(`Đã thêm ${count} sản phẩm vào giỏ hàng.`);
    } catch (err: any) {
      setError(getApiMessage(err, 'Không thể thêm sản phẩm vào giỏ hàng.'));
      if ([404, 409].includes(err?.response?.status)) await load();
    } finally { busy.current = false; setAdding(false); }
  };

  const buyNow = () => {
    if (!product || !canBuy || busy.current) return;
    busy.current = true;
    router.push({ pathname: '/checkout' as any, params: { source: 'buy_now', productId: String(product.ma_san_pham), quantity: String(count) } });
  };

  const imagesList = useMemo(() => {
    if (!product) return [];
    const list = product.images || product.danh_sach_hinh_anh || [];
    if (list.length > 0) return list;
    if (product.hinh_anh) {
      return [{ duong_dan: product.hinh_anh, la_anh_chinh: true, ma_hinh_anh: 0 }];
    }
    return [];
  }, [product]);

  const groupedSpecs: GroupedSpecification[] = useMemo(() => {
    if (!product) return [];
    if (product.specifications && product.specifications.length > 0) {
      return product.specifications;
    }
    if (product.thong_so_ky_thuat && product.thong_so_ky_thuat.length > 0) {
      const map = new Map<string, any[]>();
      for (const s of product.thong_so_ky_thuat) {
        const groupName = s.ten_nhom || 'Thông số khác';
        if (!map.has(groupName)) map.set(groupName, []);
        let val = s.gia_tri;
        if (val == null) {
          if (s.gia_tri_so != null) val = String(s.gia_tri_so);
          else if (s.gia_tri_bool != null) val = s.gia_tri_bool ? 'Có' : 'Không';
          else val = '';
        }
        map.get(groupName)!.push({
          ma_thong_so: s.ma_thong_so,
          name: s.ten_thong_so || '',
          value: val,
          unit: s.don_vi || null,
          type: s.kieu_du_lieu || 'TEXT',
        });
      }
      return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
    }
    return [];
  }, [product]);

  const hasStock = (variant: ProductVariant) => variant.trang_thai === 'DangBan' && Number(variant.so_luong) > 0;

  const getVariantSpecValue = (variant: ProductVariant, specId?: number) => {
    if (!variant.thong_so_ky_thuat) return '';
    const found = variant.thong_so_ky_thuat.find(s => specId != null && s.ma_thong_so === specId);
    if (!found) return '';
    return String(found.gia_tri ?? found.gia_tri_so ?? '').trim();
  };

  const getVariantAttrValue = (variant: ProductVariant, groupKey: string): string => {
    if (groupKey.startsWith('spec_')) {
      const specId = Number(groupKey.replace('spec_', ''));
      return getVariantSpecValue(variant, specId);
    }
    if (groupKey === 'variant_name') {
      return variant.ten_bien_the.trim();
    }
    return '';
  };

  const variantAttributeGroups = useMemo<VariantAttributeGroup[]>(() => {
    if (!variants.length) return [];

    const hasAnySpecs = variants.some(v => v.thong_so_ky_thuat && v.thong_so_ky_thuat.length > 0);
    if (!hasAnySpecs) {
      // Variants do not have thong_so_json; use ten_bien_the
      const sampleNames = variants.map(v => v.ten_bien_the.toLowerCase());
      let groupName = 'Phiên bản';
      if (sampleNames.some(n => n.includes('lít') || n.includes('lit'))) {
        groupName = 'Dung tích';
      } else if (sampleNames.some(n => n.includes('kg'))) {
        groupName = 'Khối lượng';
      } else if (sampleNames.some(n => n.includes('w'))) {
        groupName = 'Công suất';
      } else if (sampleNames.some(n => n.includes('màu'))) {
        groupName = 'Màu sắc';
      }

      const choices = Array.from(new Set(variants.map(v => v.ten_bien_the.trim()))).filter(Boolean);
      return [{
        key: 'variant_name',
        name: groupName,
        choices,
      }];
    }

    // Has specs in variants
    // 1. Color: /màu|color/i
    // 2. Power: /công\s*suất|watt|power/i
    // 3. Other special specs that differentiate variants (distinct values > 1)
    const allSpecsMap = new Map<number, { name: string; unit?: string | null; isColor: boolean; isPower: boolean; values: Set<string> }>();

    for (const v of variants) {
      for (const s of v.thong_so_ky_thuat || []) {
        if (!allSpecsMap.has(s.ma_thong_so)) {
          const name = s.ten_thong_so || `Thông số ${s.ma_thong_so}`;
          const isColor = /màu|color/i.test(name);
          const isPower = /công\s*suất|watt|power/i.test(name);
          allSpecsMap.set(s.ma_thong_so, {
            name,
            unit: s.don_vi || null,
            isColor,
            isPower,
            values: new Set(),
          });
        }
        const val = String(s.gia_tri ?? s.gia_tri_so ?? '').trim();
        if (val) allSpecsMap.get(s.ma_thong_so)!.values.add(val);
      }
    }

    const groups: VariantAttributeGroup[] = [];

    const sortChoices = (arr: string[]) => {
      return [...arr].sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b, 'vi');
      });
    };

    // 1. Color group
    let colorSpecId: number | null = null;
    for (const [id, info] of allSpecsMap.entries()) {
      if (info.isColor && info.values.size > 0) {
        colorSpecId = id;
        groups.push({
          key: `spec_${id}`,
          name: info.name || 'Màu sắc',
          unit: info.unit,
          choices: sortChoices(Array.from(info.values)),
        });
        break;
      }
    }

    // 2. Power group
    let powerSpecId: number | null = null;
    for (const [id, info] of allSpecsMap.entries()) {
      if (info.isPower && info.values.size > 0) {
        powerSpecId = id;
        groups.push({
          key: `spec_${id}`,
          name: info.name || 'Công suất',
          unit: info.unit,
          choices: sortChoices(Array.from(info.values)),
        });
        break;
      }
    }

    // 3. Special differentiating specs (distinct values > 1, not color and not power)
    for (const [id, info] of allSpecsMap.entries()) {
      if (id !== colorSpecId && id !== powerSpecId && info.values.size > 1) {
        groups.push({
          key: `spec_${id}`,
          name: info.name,
          unit: info.unit,
          choices: sortChoices(Array.from(info.values)),
        });
      }
    }

    // Fallback if no groups matched
    if (groups.length === 0) {
      groups.push({
        key: 'variant_name',
        name: 'Phiên bản',
        choices: Array.from(new Set(variants.map(v => v.ten_bien_the.trim()))),
      });
    }

    return groups;
  }, [variants]);

  const powerGroup = useMemo(() => variantAttributeGroups.find(g => /công\s*suất|watt|power/i.test(g.name)), [variantAttributeGroups]);
  const colorGroup = useMemo(() => variantAttributeGroups.find(g => /màu|color/i.test(g.name)), [variantAttributeGroups]);

  const isChoiceAvailable = useCallback((group: VariantAttributeGroup, choice: string) => {
    const inStockWithChoice = variants.filter(v => hasStock(v) && getVariantAttrValue(v, group.key) === choice);
    if (inStockWithChoice.length === 0) return false;

    // Requirement:
    // "và phải chọn được công suất thì không chọn các màu không còn công suất đó nữa"

    // If checking Power:
    // Any wattage that exists in stock is selectable ("phải chọn được công suất")
    if (powerGroup && group.key === powerGroup.key) {
      return true;
    }

    // If checking Color:
    // If a Power is currently selected, color must have that power ("không chọn các màu không còn công suất đó nữa")
    if (colorGroup && group.key === colorGroup.key && powerGroup && selectedVariant) {
      const selectedPower = getVariantAttrValue(selectedVariant, powerGroup.key);
      if (selectedPower) {
        return inStockWithChoice.some(v => getVariantAttrValue(v, powerGroup.key) === selectedPower);
      }
    }

    // For other special groups: check compatibility with selected Power
    if (selectedVariant && powerGroup) {
      const selectedPower = getVariantAttrValue(selectedVariant, powerGroup.key);
      if (selectedPower && !inStockWithChoice.some(v => getVariantAttrValue(v, powerGroup.key) === selectedPower)) {
        return false;
      }
    }

    return true;
  }, [variants, powerGroup, colorGroup, selectedVariant]);

  const onSelectChoice = useCallback((group: VariantAttributeGroup, choice: string) => {
    let candidates = variants.filter(v => hasStock(v) && getVariantAttrValue(v, group.key) === choice);
    if (candidates.length === 0) {
      candidates = variants.filter(v => getVariantAttrValue(v, group.key) === choice);
    }
    if (candidates.length === 0) return;

    let best = candidates[0];

    // If selected Power:
    // "và phải chọn được công suất thì không chọn các màu không còn công suất đó nữa"
    if (powerGroup && group.key === powerGroup.key) {
      if (colorGroup && selectedVariant) {
        const currentColor = getVariantAttrValue(selectedVariant, colorGroup.key);
        const matchSameColor = candidates.find(v => getVariantAttrValue(v, colorGroup.key) === currentColor);
        if (matchSameColor) {
          best = matchSameColor;
        } else {
          // Current color doesn't have this wattage -> auto-switch to a valid color for this wattage!
          best = candidates[0];
        }
      }
    } else if (colorGroup && group.key === colorGroup.key) {
      // If selected Color:
      if (powerGroup && selectedVariant) {
        const currentPower = getVariantAttrValue(selectedVariant, powerGroup.key);
        const matchSamePower = candidates.find(v => getVariantAttrValue(v, powerGroup.key) === currentPower);
        if (matchSamePower) best = matchSamePower;
        else best = candidates[0];
      }
    } else if (selectedVariant) {
      const match = candidates.find(v =>
        (!powerGroup || getVariantAttrValue(v, powerGroup.key) === getVariantAttrValue(selectedVariant, powerGroup.key)) &&
        (!colorGroup || getVariantAttrValue(v, colorGroup.key) === getVariantAttrValue(selectedVariant, colorGroup.key))
      );
      if (match) best = match;
      else best = candidates[0];
    }

    setSelectedVariantId(best.ma_bien_the);
    setQuantity('1');
    setError('');
  }, [variants, powerGroup, colorGroup, selectedVariant]);

  const displayedGroupedSpecs = useMemo(() => {
    if (!selectedVariant?.thong_so_ky_thuat?.length) return groupedSpecs;
    const variantSpecMap = new Map<number, ProductSpecification>();
    for (const spec of selectedVariant.thong_so_ky_thuat) {
      variantSpecMap.set(spec.ma_thong_so, spec);
    }

    return groupedSpecs.map(group => ({
      group: group.group,
      items: group.items.map(item => {
        const vSpec = variantSpecMap.get(item.ma_thong_so);
        if (vSpec) {
          const val = vSpec.gia_tri ?? (vSpec.gia_tri_so != null ? String(vSpec.gia_tri_so) : vSpec.gia_tri_bool != null ? (vSpec.gia_tri_bool ? 'Có' : 'Không') : item.value);
          return {
            ...item,
            value: String(val),
            unit: vSpec.don_vi || item.unit,
          };
        }
        return item;
      }),
    }));
  }, [groupedSpecs, selectedVariant]);

  if (loading) return <LoadingState message="Đang tải chi tiết sản phẩm..." />;
  if (!product) return <SafeAreaView style={styles.safe}><EmptyState icon="inventory-2" title="Chưa có thông tin sản phẩm" message={loadError} action="Thử lại" onAction={load} /><Pressable accessibilityRole="button" onPress={() => router.replace('/products')}><Text style={styles.centerLink}>Xem sản phẩm khác</Text></Pressable></SafeAreaView>;

  const currentImageUri = selectedImageUri || product.hinh_anh;
  const rating = reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.so_sao), 0) / reviews.length).toFixed(1) : null;
  const stockLabel = product.trang_thai === 'NgungBan' ? 'Sản phẩm đã ngừng bán' : product.trang_thai === 'HetHang' || max < 1 ? 'Tạm hết hàng' : !available ? 'Sản phẩm chưa sẵn sàng bán' : `Còn ${displayStock} sản phẩm`;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        {/* Main Product Image */}
        <Pressable accessibilityRole="button" accessibilityLabel="Xem ảnh sản phẩm" style={styles.imageCard} onPress={() => setZoom(true)}>
          <ProductImage uri={currentImageUri} style={styles.image} />
          <View style={styles.imageLabel}>
            <MaterialIcons name="zoom-in" size={19} color="#176B52" />
            <Text style={styles.muted}>Phóng to ảnh</Text>
          </View>
        </Pressable>

        {/* Thumbnail Gallery (if more than 1 image) */}
        {imagesList.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {imagesList.map((img, idx) => {
              const isSelected = img.duong_dan === currentImageUri;
              return (
                <Pressable
                  key={img.ma_hinh_anh || idx}
                  style={[styles.thumbnailWrap, isSelected && styles.thumbnailActive]}
                  onPress={() => setSelectedImageUri(img.duong_dan)}
                >
                  <Image source={{ uri: img.duong_dan }} style={styles.thumbnail} resizeMode="cover" />
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.row}>
          <Text style={styles.category}>{product.ten_danh_muc || 'ĐIỆN GIA DỤNG'}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/cart' as any)}>
            <Text style={styles.link}>Xem giỏ hàng</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{product.ten_san_pham}</Text>
        <Text style={styles.muted}>Mã: {product.ma_san_pham_code}{product.ten_thuong_hieu ? ` · ${product.ten_thuong_hieu}` : ''}</Text>
        {rating && !reviewError ? <Text style={styles.rating}>★ {rating}/5 · {reviews.length} đánh giá</Text> : null}
        <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
        <View style={styles.inline}>
          <MaterialIcons name={available ? 'check-circle' : 'error-outline'} size={19} color={available ? '#176B52' : '#A52D2D'} />
          <Text style={[styles.stock, !available && styles.error]}>{stockLabel}</Text>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.muted}>Giao hàng miễn phí · Thanh toán khi nhận hàng (COD)</Text>
          {product.bao_hanh != null && Number(product.bao_hanh) > 0 ? (
            <Text style={styles.muted}>Bảo hành {product.bao_hanh} tháng chính hãng.</Text>
          ) : null}
        </View>

        {/* Variant selection: only Color, Power, or special product specs */}
        {variantAttributeGroups.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tùy chọn sản phẩm</Text>
            {selectedVariant ? (
              <Text style={styles.muted}>
                Đang chọn: <Text style={{ fontWeight: '700', color: '#183C35' }}>{selectedVariant.ten_bien_the}</Text>
              </Text>
            ) : null}

            {variantAttributeGroups.map(group => {
              const selectedValue = selectedVariant ? getVariantAttrValue(selectedVariant, group.key) : '';
              return (
                <View key={group.key} style={styles.specChoice}>
                  <Text style={styles.choiceTitle}>{group.name}</Text>
                  <View style={styles.variantRow}>
                    {group.choices.map(choice => {
                      const isSelected = selectedValue === choice;
                      const isAvailable = isChoiceAvailable(group, choice);

                      return (
                        <Pressable
                          key={choice}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                          disabled={!isAvailable}
                          onPress={() => onSelectChoice(group, choice)}
                          style={[
                            styles.variantButton,
                            isSelected && styles.variantSelected,
                            !isAvailable && styles.disabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.variantLabel,
                              isSelected && styles.variantLabelSelected,
                              !isAvailable && styles.disabledText,
                            ]}
                          >
                            {choice}{group.unit && !choice.includes(group.unit) ? ` ${group.unit}` : ''}
                          </Text>
                          {!isAvailable ? (
                            <Text style={styles.unavailableBadge}>Không có sẵn</Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Quantity selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chọn số lượng</Text>
          <View style={styles.row}>
            <View style={styles.inline}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Giảm số lượng"
                disabled={!available || adding || !Number.isInteger(count) || count <= 1}
                style={[styles.qtyButton, (!available || count <= 1) && styles.disabled]}
                onPress={() => changeQuantity(String(count - 1))}
              >
                <MaterialIcons name="remove" size={20} color="#183C35" />
              </Pressable>
              <TextInput
                accessibilityLabel="Số lượng mua"
                value={quantity}
                onChangeText={changeQuantity}
                editable={Boolean(available && !adding)}
                keyboardType="number-pad"
                maxLength={4}
                selectTextOnFocus
                style={styles.quantityInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tăng số lượng"
                disabled={!available || adding || !Number.isInteger(count) || count >= max}
                style={[styles.qtyButton, (!available || count >= max) && styles.disabled]}
                onPress={() => changeQuantity(String(Math.max(1, count + 1)))}
              >
                <MaterialIcons name="add" size={20} color="#183C35" />
              </Pressable>
            </View>
            <Text style={styles.muted}>Tối đa {max} sản phẩm</Text>
          </View>
          {available && !validQuantity ? <Text accessibilityRole="alert" style={styles.error}>Nhập số lượng nguyên từ 1 đến {max}.</Text> : null}
          <Text style={styles.hint}>Giá và tồn kho được kiểm tra lại trước khi xác nhận đơn.</Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>{product.mo_ta?.trim() || 'Thông tin mô tả đang được cập nhật.'}</Text>
        </View>

        {/* Technical Specifications by Group */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
          {displayedGroupedSpecs.length > 0 ? (
            displayedGroupedSpecs.map(group => (
              <View key={group.group} style={styles.specGroupBlock}>
                <Text style={styles.specGroupTitle}>{group.group.toUpperCase()}</Text>
                {group.items.map((item, itemIdx) => {
                  const valStr = String(item.value ?? '');
                  const unitStr = item.unit && !valStr.includes(item.unit) ? ` ${item.unit}` : '';
                  return (
                    <View key={item.ma_thong_so || `${item.name}-${itemIdx}`} style={styles.specRow}>
                      <Text style={styles.specLabel}>{item.name}</Text>
                      <Text style={styles.specValue}>{valStr}{unitStr}</Text>
                    </View>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.hint}>Thông số kỹ thuật chi tiết đang được cập nhật.</Text>
          )}
        </View>

        {/* Customer Reviews */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
          {reviewLoading ? (
            <Text style={styles.muted}>Đang tải đánh giá...</Text>
          ) : reviewError ? (
            <>
              <Text style={styles.error}>{reviewError}</Text>
              <Pressable accessibilityRole="button" onPress={loadReviews}>
                <Text style={styles.link}>Tải lại đánh giá</Text>
              </Pressable>
            </>
          ) : reviews.length ? (
            <>
              <Text style={styles.rating}>★ {rating}/5 · {reviews.length} đánh giá</Text>
              {reviews.slice(0, reviewCount).map(review => (
                <View key={review.ma_danh_gia} style={styles.review}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{review.ho_ten || 'Khách hàng'}</Text>
                    <Text style={styles.rating}>{review.so_sao}/5 ★</Text>
                  </View>
                  <Text style={styles.hint}>{formatDate(review.ngay_danh_gia)}</Text>
                  <Text style={styles.description}>{review.noi_dung || 'Khách hàng đã chấm điểm sản phẩm.'}</Text>
                </View>
              ))}
              {reviewCount < reviews.length ? (
                <Pressable accessibilityRole="button" onPress={() => setReviewCount(value => value + 5)}>
                  <Text style={styles.link}>Xem thêm đánh giá</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={styles.muted}>Sản phẩm chưa có đánh giá.</Text>
          )}
        </View>

        {/* Related Products */}
        {related.length || relatedError ? (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Cùng danh mục</Text>
            {relatedError ? (
              <Text style={styles.muted}>{relatedError}</Text>
            ) : (
              <View style={styles.related}>
                {related.map(item => (
                  <View key={item.ma_san_pham} style={styles.relatedItem}>
                    <ProductCard product={item} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {notice ? (
          <View accessibilityLiveRegion="polite" style={styles.row}>
            <Text style={styles.stock}>{notice}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/cart' as any)}>
              <Text style={styles.link}>Mở giỏ hàng</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.muted}>Tạm tính</Text>
          <Text style={styles.footerPrice}>{validQuantity ? formatCurrency(Number(displayPrice) * count) : '—'}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thêm vào giỏ hàng"
            disabled={!canBuy}
            style={[styles.action, styles.addButton, !canBuy && styles.disabled]}
            onPress={addToCart}
          >
            <MaterialIcons name="add-shopping-cart" size={19} color="#176B52" />
            <Text style={styles.addText}>{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thanh toán ngay"
            disabled={!canBuy}
            style={[styles.action, styles.buyButton, !canBuy && styles.disabled]}
            onPress={buyNow}
          >
            <MaterialIcons name="payments" size={19} color="#fff" />
            <Text style={styles.buyText}>Thanh toán ngay</Text>
          </Pressable>
        </View>
      </View>

      {/* Zoom Modal */}
      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <View style={styles.overlay}>
          <View style={styles.zoomCard}>
            <Text style={styles.sectionTitle}>{product.ten_san_pham}</Text>
            <ProductImage uri={currentImageUri} style={styles.zoomImage} />
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng ảnh sản phẩm" onPress={() => setZoom(false)} style={styles.qtyButton}>
              <MaterialIcons name="close" size={24} color="#183C35" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, paddingBottom: 28, width: '100%', maxWidth: 800, alignSelf: 'center', gap: 14 },
  imageCard: { borderRadius: 24, backgroundColor: '#EEF2E9', overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.25, maxHeight: 380 },
  imageLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 },
  galleryRow: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  thumbnailWrap: { width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E3E9E1', overflow: 'hidden', padding: 2, backgroundColor: '#fff' },
  thumbnailActive: { borderColor: '#176B52' },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  category: { color: '#176B52', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#183C35', fontSize: 25, lineHeight: 32, fontWeight: '800' },
  price: { color: '#176B52', fontSize: 26, fontWeight: '800' },
  stock: { color: '#176B52', fontSize: 13, fontWeight: '700', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muted: { color: '#6D7D76', fontSize: 13, lineHeight: 21 },
  hint: { color: '#6D7D76', fontSize: 12, lineHeight: 19 },
  name: { color: '#183C35', fontSize: 14, fontWeight: '700' },
  rating: { color: '#956900', fontSize: 13, fontWeight: '700' },
  link: { color: '#176B52', fontWeight: '700', paddingVertical: 8, fontSize: 13 },
  centerLink: { color: '#176B52', textAlign: 'center', padding: 20 },
  benefits: { backgroundColor: '#EAF2E6', padding: 14, borderRadius: 14, gap: 6 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variantButton: { minWidth: 108, borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 12, padding: 10, gap: 4, backgroundColor: '#fff' },
  variantSelected: { borderColor: '#176B52', backgroundColor: '#EDF5E9' },
  variantLabel: { color: '#183C35', fontSize: 14, fontWeight: '800' },
  variantLabelSelected: { color: '#176B52' },
  variantPrice: { color: '#6D7D76', fontSize: 11 },
  disabledText: { color: '#8A9993' },
  unavailableBadge: { fontSize: 10, color: '#A52D2D', fontWeight: '600', marginTop: 2 },
  specChoice: { gap: 9 },
  choiceTitle: { color: '#183C35', fontSize: 14, fontWeight: '800' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E3E9E1', backgroundColor: '#fff', gap: 14 },
  sectionTitle: { color: '#183C35', fontSize: 17, fontWeight: '800' },
  description: { color: '#596C62', fontSize: 14, lineHeight: 23 },
  qtyButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EDF2E9', alignItems: 'center', justifyContent: 'center' },
  quantityInput: { width: 54, height: 44, borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 10, textAlign: 'center', color: '#183C35', fontSize: 16, fontWeight: '700' },
  specGroupBlock: { marginBottom: 12 },
  specGroupTitle: { fontSize: 11, fontWeight: '800', color: '#176B52', letterSpacing: 1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F0F4EE', paddingBottom: 4 },
  specRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#EDF2E9' },
  specLabel: { width: '40%', color: '#6D7D76', fontSize: 13 },
  specValue: { flex: 1, color: '#183C35', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  review: { gap: 8, paddingTop: 14, borderTopWidth: 1, borderColor: '#EDF2E9' },
  related: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  relatedItem: { width: '47%', flexGrow: 1 },
  footer: { padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E3E9E1', gap: 10 },
  footerPrice: { color: '#176B52', fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 54, padding: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  addButton: { borderWidth: 1, borderColor: '#176B52', backgroundColor: '#EDF5E9' },
  buyButton: { backgroundColor: '#176B52' },
  addText: { color: '#176B52', fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  buyText: { color: '#fff', fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  error: { color: '#A52D2D', fontSize: 13, lineHeight: 20 },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 20 },
  zoomCard: { width: '100%', maxWidth: 760, backgroundColor: '#fff', borderRadius: 22, padding: 18, alignItems: 'center', gap: 16 },
  zoomImage: { width: '100%', aspectRatio: 1, maxHeight: 500 },
});
