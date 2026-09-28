import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductCard, ProductImage } from '@/components/shop-ui';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import type { Product, ProductReview } from '@/types';
import { formatCurrency, formatDate, getApiMessage } from '@/utils/format';

export default function ProductDetailScreen() {
  const { id, quantity } = useLocalSearchParams<{ id: string; quantity?: string }>();
  return <ProductDetail key={String(id)} id={id} initialQuantity={quantity} />;
}

function ProductDetail({ id, initialQuantity }: { id: string; initialQuantity?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(/^\d+$/.test(initialQuantity || '') && Number(initialQuantity) > 0 ? String(Math.min(999, Number(initialQuantity))) : '1');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
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
      setRelatedError('');
      void productService.getProducts({ ma_danh_muc: data.ma_danh_muc, limit: 6 }).then(result => {
        if (current === version.current) setRelated((result.data as Product[]).filter(item => item.ma_san_pham !== data.ma_san_pham && item.trang_thai === 'DangBan' && Number(item.so_luong) > 0).slice(0, 4));
      }).catch(() => { if (current === version.current) setRelatedError('Chưa tải được sản phẩm cùng danh mục.'); });
      void loadReviews();
    } catch (err: any) {
      if (current === version.current) {
        setLoadError(getApiMessage(err, 'Không thể tải thông tin sản phẩm.'));
        // Stale product data must not remain purchasable after a failed refresh.
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
  const max = Math.min(999, Number(product?.so_luong || 0));
  const available = product?.trang_thai === 'DangBan' && max > 0 && Number(product.gia_ban) > 0;
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
    router.push({ pathname: '/checkout', params: { source: 'buy_now', productId: String(product.ma_san_pham), quantity: String(count) } });
  };

  if (loading) return <LoadingState message="Đang tải chi tiết sản phẩm..." />;
  if (!product) return <SafeAreaView style={styles.safe}><EmptyState icon="inventory-2" title="Chưa có thông tin sản phẩm" message={loadError} action="Thử lại" onAction={load} /><Pressable accessibilityRole="button" onPress={() => router.replace('/products')}><Text style={styles.centerLink}>Xem sản phẩm khác</Text></Pressable></SafeAreaView>;

  const details = product.chi_tiet_san_pham;
  const specs = [
    ['Mã sản phẩm', product.ma_san_pham_code],
    ['Thương hiệu', product.ten_thuong_hieu],
    ['Danh mục', product.ten_danh_muc],
    ['Bảo hành', product.bao_hanh == null ? null : Number(product.bao_hanh) > 0 ? `${product.bao_hanh} tháng` : 'Không áp dụng'],
    ['Công suất', details?.cong_suat], ['Dung tích', details?.dung_tich], ['Kích thước', details?.kich_thuoc],
    ['Màu sắc', details?.mau_sac], ['Xuất xứ', details?.xuat_xu],
  ].filter(([, value]) => value != null && String(value).trim() !== '');
  const rating = reviews.length ? (reviews.reduce((sum, item) => sum + Number(item.so_sao), 0) / reviews.length).toFixed(1) : null;
  const stockLabel = product.trang_thai === 'NgungBan' ? 'Sản phẩm đã ngừng bán' : product.trang_thai === 'HetHang' || max < 1 ? 'Tạm hết hàng' : !available ? 'Sản phẩm chưa sẵn sàng bán' : `Còn ${product.so_luong} sản phẩm`;

  return <SafeAreaView style={styles.safe} edges={['bottom']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <Pressable accessibilityRole="button" accessibilityLabel="Xem ảnh sản phẩm" style={styles.imageCard} onPress={() => setZoom(true)}>
        <ProductImage uri={product.hinh_anh} style={styles.image} />
        <View style={styles.imageLabel}><MaterialIcons name="zoom-in" size={19} color="#176B52" /><Text style={styles.muted}>Xem ảnh sản phẩm</Text></View>
      </Pressable>
      <View style={styles.row}><Text style={styles.category}>{product.ten_danh_muc || 'ĐIỆN GIA DỤNG'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/cart')}><Text style={styles.link}>Xem giỏ hàng</Text></Pressable></View>
      <Text style={styles.title}>{product.ten_san_pham}</Text>
      <Text style={styles.muted}>Mã: {product.ma_san_pham_code}{product.ten_thuong_hieu ? ` · ${product.ten_thuong_hieu}` : ''}</Text>
      {rating && !reviewError ? <Text style={styles.rating}>★ {rating}/5 · {reviews.length} đánh giá</Text> : null}
      <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
      <View style={styles.inline}><MaterialIcons name={available ? 'check-circle' : 'error-outline'} size={19} color={available ? '#176B52' : '#A52D2D'} /><Text style={[styles.stock, !available && styles.error]}>{stockLabel}</Text></View>
      <View style={styles.benefits}><Text style={styles.muted}>Giao hàng miễn phí · Thanh toán khi nhận hàng (COD)</Text>{product.bao_hanh != null && Number(product.bao_hanh) > 0 ? <Text style={styles.muted}>Bảo hành {product.bao_hanh} tháng theo thông tin sản phẩm.</Text> : null}</View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Chọn số lượng</Text>
        <View style={styles.row}>
          <View style={styles.inline}>
            <Pressable accessibilityRole="button" accessibilityLabel="Giảm số lượng" disabled={!available || adding || !Number.isInteger(count) || count <= 1} style={[styles.qtyButton, (!available || count <= 1) && styles.disabled]} onPress={() => changeQuantity(String(count - 1))}><MaterialIcons name="remove" size={20} color="#183C35" /></Pressable>
            <TextInput accessibilityLabel="Số lượng mua" value={quantity} onChangeText={changeQuantity} editable={Boolean(available && !adding)} keyboardType="number-pad" maxLength={4} selectTextOnFocus style={styles.quantityInput} />
            <Pressable accessibilityRole="button" accessibilityLabel="Tăng số lượng" disabled={!available || adding || !Number.isInteger(count) || count >= max} style={[styles.qtyButton, (!available || count >= max) && styles.disabled]} onPress={() => changeQuantity(String(Math.max(1, count + 1)))}><MaterialIcons name="add" size={20} color="#183C35" /></Pressable>
          </View>
          <Text style={styles.muted}>Tối đa {max} sản phẩm</Text>
        </View>
        {available && !validQuantity ? <Text accessibilityRole="alert" style={styles.error}>Nhập số lượng nguyên từ 1 đến {max}.</Text> : null}
        <Text style={styles.hint}>Giá và tồn kho được kiểm tra lại trước khi xác nhận đơn.</Text>
      </View>
      <View style={styles.card}><Text style={styles.sectionTitle}>Mô tả sản phẩm</Text><Text style={styles.description}>{product.mo_ta?.trim() || 'Thông tin mô tả đang được cập nhật.'}</Text></View>
      <View style={styles.card}><Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
        {specs.map(([label, value]) => <View style={styles.specRow} key={label}><Text style={styles.specLabel}>{label}</Text><Text style={styles.specValue}>{value}</Text></View>)}
        {details?.thong_so_khac ? <><Text style={styles.name}>Thông số khác</Text><Text style={styles.description}>{details.thong_so_khac}</Text></> : null}
        {!details ? <Text style={styles.hint}>Thông số kỹ thuật chi tiết đang được cập nhật.</Text> : null}
      </View>
      <View style={styles.card}><Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
        {reviewLoading ? <Text style={styles.muted}>Đang tải đánh giá...</Text> : reviewError ? <><Text style={styles.error}>{reviewError}</Text><Pressable accessibilityRole="button" onPress={loadReviews}><Text style={styles.link}>Tải lại đánh giá</Text></Pressable></> : reviews.length ? <>
          <Text style={styles.rating}>★ {rating}/5 · {reviews.length} đánh giá</Text>
          {reviews.slice(0, reviewCount).map(review => <View key={review.ma_danh_gia} style={styles.review}><View style={styles.row}><Text style={styles.name}>{review.ho_ten || 'Khách hàng'}</Text><Text style={styles.rating}>{review.so_sao}/5 ★</Text></View><Text style={styles.hint}>{formatDate(review.ngay_danh_gia)}</Text><Text style={styles.description}>{review.noi_dung || 'Khách hàng đã chấm điểm sản phẩm.'}</Text></View>)}
          {reviewCount < reviews.length ? <Pressable accessibilityRole="button" onPress={() => setReviewCount(value => value + 5)}><Text style={styles.link}>Xem thêm đánh giá</Text></Pressable> : null}
        </> : <Text style={styles.muted}>Sản phẩm chưa có đánh giá.</Text>}
      </View>
      {related.length || relatedError ? <View style={{ gap: 14 }}><Text style={styles.sectionTitle}>Cùng danh mục</Text>{relatedError ? <Text style={styles.muted}>{relatedError}</Text> : <View style={styles.related}>{related.map(item => <View key={item.ma_san_pham} style={styles.relatedItem}><ProductCard product={item} /></View>)}</View>}</View> : null}
    </ScrollView>
    <View style={styles.footer}>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {notice ? <View accessibilityLiveRegion="polite" style={styles.row}><Text style={styles.stock}>{notice}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/cart')}><Text style={styles.link}>Mở giỏ hàng</Text></Pressable></View> : null}
      <View style={styles.row}><Text style={styles.muted}>Tạm tính</Text><Text style={styles.footerPrice}>{validQuantity ? formatCurrency(Number(product.gia_ban) * count) : '—'}</Text></View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Thêm vào giỏ hàng" disabled={!canBuy} style={[styles.action, styles.addButton, !canBuy && styles.disabled]} onPress={addToCart}><MaterialIcons name="add-shopping-cart" size={19} color="#176B52" /><Text style={styles.addText}>{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Thanh toán ngay" disabled={!canBuy} style={[styles.action, styles.buyButton, !canBuy && styles.disabled]} onPress={buyNow}><MaterialIcons name="payments" size={19} color="#fff" /><Text style={styles.buyText}>Thanh toán ngay</Text></Pressable>
      </View>
    </View>
    <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}><View style={styles.overlay}><View style={styles.zoomCard}><Text style={styles.sectionTitle}>{product.ten_san_pham}</Text><ProductImage uri={product.hinh_anh} style={styles.zoomImage} /><Pressable accessibilityRole="button" accessibilityLabel="Đóng ảnh sản phẩm" onPress={() => setZoom(false)} style={styles.qtyButton}><MaterialIcons name="close" size={24} color="#183C35" /></Pressable></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { padding: 20, paddingBottom: 28, width: '100%', maxWidth: 800, alignSelf: 'center', gap: 14 },
  imageCard: { borderRadius: 24, backgroundColor: '#EEF2E9', overflow: 'hidden' }, image: { width: '100%', aspectRatio: 1.4, maxHeight: 380 }, imageLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  category: { color: '#176B52', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, title: { color: '#183C35', fontSize: 27, lineHeight: 34, fontWeight: '800' },
  price: { color: '#176B52', fontSize: 28, fontWeight: '800' }, stock: { color: '#176B52', fontSize: 13, fontWeight: '700', flexShrink: 1 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }, inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muted: { color: '#6D7D76', fontSize: 13, lineHeight: 21 }, hint: { color: '#6D7D76', fontSize: 12, lineHeight: 19 }, name: { color: '#183C35', fontSize: 14, fontWeight: '700' }, rating: { color: '#956900', fontSize: 13, fontWeight: '700' }, link: { color: '#176B52', fontWeight: '700', paddingVertical: 8, fontSize: 13 }, centerLink: { color: '#176B52', textAlign: 'center', padding: 20 },
  benefits: { backgroundColor: '#EAF2E6', padding: 14, borderRadius: 14, gap: 6 }, card: { padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E3E9E1', backgroundColor: '#fff', gap: 14 }, sectionTitle: { color: '#183C35', fontSize: 17, fontWeight: '800' }, description: { color: '#596C62', fontSize: 14, lineHeight: 23 },
  qtyButton: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EDF2E9', alignItems: 'center', justifyContent: 'center' }, quantityInput: { width: 54, height: 44, borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 10, textAlign: 'center', color: '#183C35', fontSize: 16, fontWeight: '700' },
  specRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#EDF2E9' }, specLabel: { width: '38%', color: '#6D7D76', fontSize: 13 }, specValue: { flex: 1, color: '#183C35', fontSize: 13, lineHeight: 20 }, review: { gap: 8, paddingTop: 14, borderTopWidth: 1, borderColor: '#EDF2E9' },
  related: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, relatedItem: { width: '47%', flexGrow: 1 },
  footer: { padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E3E9E1', gap: 10 }, footerPrice: { color: '#176B52', fontSize: 22, fontWeight: '800' }, actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 54, padding: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, addButton: { borderWidth: 1, borderColor: '#176B52', backgroundColor: '#EDF5E9' }, buyButton: { backgroundColor: '#176B52' }, addText: { color: '#176B52', fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'center' }, buyText: { color: '#fff', fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'center' }, disabled: { opacity: 0.45 }, error: { color: '#A52D2D', fontSize: 13, lineHeight: 20 },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 20 }, zoomCard: { width: '100%', maxWidth: 760, backgroundColor: '#fff', borderRadius: 22, padding: 18, alignItems: 'center', gap: 16 }, zoomImage: { width: '100%', aspectRatio: 1, maxHeight: 500 },
});
