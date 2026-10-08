import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage, ScreenHeading } from '@/components/shop-ui';
import { cartService } from '@/services/cart.service';
import type { CartItem } from '@/types';
import { formatCurrency, getApiMessage } from '@/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const loadCart = useCallback(async () => {
    try {
      const result = await cartService.getCart();
      setItems(result.data?.items || []);
      setError('');
    } catch (err) { setError(getApiMessage(err, 'Không thể tải giỏ hàng.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadCart(); }, [loadCart]));

  const update = async (item: CartItem, quantity: number) => {
    if (busy.current) return;
    busy.current = true;
    setUpdating(true);
    setError('');
    try {
      if (quantity <= 0) await cartService.removeCartItem(item.ma_san_pham, item.ma_bien_the);
      else await cartService.updateCartItem(item.ma_san_pham, quantity, item.ma_bien_the);
      await loadCart();
    } catch (err) { setError(getApiMessage(err, 'Không thể cập nhật giỏ hàng.')); }
    finally { busy.current = false; setUpdating(false); }
  };

  const total = items.reduce((sum, item) => sum + Number(item.gia_ban) * item.so_luong, 0);
  if (loading) return <LoadingState message="Đang tải giỏ hàng..." />;
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadCart(); }} />}>
      <ScreenHeading eyebrow="GIỎ HÀNG CỦA BẠN" title="Sắp về với tổ ấm" subtitle="Kiểm tra sản phẩm rồi tiếp tục đến bước thanh toán." icon="shopping-bag" />
      {error ? <View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.error}>{error}</Text><Pressable onPress={loadCart}><Text style={styles.link}>Tải lại giỏ hàng</Text></Pressable></View> : null}
      {!items.length ? <EmptyState icon="shopping-bag" title="Giỏ hàng chờ bạn chọn" action="Khám phá sản phẩm" onAction={() => router.push('/products')} /> : <>
        {items.map(item => <View style={styles.item} key={`${item.ma_san_pham}:${item.ma_bien_the || 0}`}>
          <ProductImage uri={item.hinh_anh} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.ten_san_pham}</Text>
            {item.ten_bien_the ? <Text style={styles.muted}>{item.ten_bien_the}</Text> : null}
            <Text style={styles.price}>{formatCurrency(item.gia_ban)}</Text>
            {item.trang_thai !== 'DangBan' || Number(item.ton_kho) < item.so_luong ? <Text style={styles.error}>Sản phẩm không bán hoặc không đủ tồn kho.</Text> : null}
            <View style={styles.quantity}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Giảm số lượng ${item.ten_san_pham}`} disabled={updating} style={styles.qtyButton} onPress={() => update(item, item.so_luong - 1)}><MaterialIcons name="remove" size={18} color="#183C35" /></Pressable>
              <Text style={styles.name}>{item.so_luong}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Tăng số lượng ${item.ten_san_pham}`} disabled={updating || item.so_luong >= Number(item.ton_kho)} style={styles.qtyButton} onPress={() => update(item, item.so_luong + 1)}><MaterialIcons name="add" size={18} color="#183C35" /></Pressable>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${item.ten_san_pham}`} disabled={updating} onPress={() => update(item, 0)} hitSlop={12}><MaterialIcons name="delete-outline" size={24} color="#6D7D76" /></Pressable>
        </View>)}
        <View style={styles.summary}>
          <Text style={styles.name}>Tạm tính ({items.reduce((sum, item) => sum + item.so_luong, 0)} sản phẩm)</Text>
          <Text style={styles.total}>{formatCurrency(total)}</Text>
          <Text style={styles.muted}>Nhập thông tin nhận hàng và kiểm tra tổng tiền ở bước tiếp theo. Thanh toán khi nhận hàng.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Tiến hành thanh toán" disabled={updating || refreshing || Boolean(error)} style={[styles.button, (updating || refreshing || Boolean(error)) && { opacity: 0.5 }]} onPress={() => router.push('/checkout')}>
            <Text style={styles.buttonText}>{updating ? 'Đang cập nhật...' : 'Tiến hành thanh toán'}</Text><MaterialIcons name="arrow-forward" color="#fff" size={20} />
          </Pressable>
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { padding: 20, paddingBottom: 30, width: '100%', maxWidth: 760, alignSelf: 'center' },
  item: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#EAF0E7' },
  image: { width: 70, height: 70, borderRadius: 12 }, info: { flex: 1, gap: 6 }, name: { color: '#183C35', fontWeight: '700', fontSize: 14 }, price: { color: '#176B52', fontWeight: '800' },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 }, qtyButton: { width: 36, height: 36, backgroundColor: '#EDF2E9', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#A52D2D', fontSize: 13, lineHeight: 20 }, errorBox: { backgroundColor: '#FBEDEC', padding: 16, borderRadius: 12, marginBottom: 12 }, link: { color: '#176B52', paddingTop: 10, fontWeight: '700' },
  summary: { backgroundColor: '#fff', padding: 22, borderRadius: 22, gap: 16, marginTop: 10 }, total: { color: '#176B52', fontSize: 26, fontWeight: '800' }, muted: { color: '#6D7D76', lineHeight: 22, fontSize: 13 },
  button: { minHeight: 54, backgroundColor: '#176B52', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
