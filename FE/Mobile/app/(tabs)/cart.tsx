import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage, ScreenHeading } from '@/components/shop-ui';
import { cartService } from '../../services/cart.service';
import { orderService } from '../../services/order.service';
import type { CartItem, User } from '../../types';
import { formatCurrency, getApiMessage } from '../../utils/format';

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const [cartResponse, userString] = await Promise.all([cartService.getCart(), AsyncStorage.getItem('user')]);
      const storedUser = userString ? JSON.parse(userString) as User : null;
      setItems(cartResponse.data?.items || []);
      setUser(storedUser);
      setAddress((current) => current || storedUser?.dia_chi || '');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để xem giỏ hàng');
        router.replace('/(auth)/login' as any);
      } else {
        Alert.alert('Lỗi', getApiMessage(error, 'Không thể tải giỏ hàng'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadCart();
  }, [loadCart]));

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.gia_ban || 0) * Number(item.so_luong || 0), 0), [items]);

  const refresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const changeQuantity = async (item: CartItem, delta: number) => {
    const nextQuantity = Number(item.so_luong) + delta;
    try {
      if (nextQuantity <= 0) {
        await cartService.removeCartItem(item.ma_san_pham);
      } else {
        await cartService.updateCartItem(item.ma_san_pham, nextQuantity);
      }
      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', getApiMessage(error, 'Không thể cập nhật giỏ hàng'));
    }
  };

  const removeItem = async (id: number) => {
    try {
      await cartService.removeCartItem(id);
      await loadCart();
    } catch (error) {
      Alert.alert('Lỗi', getApiMessage(error, 'Không thể xóa sản phẩm'));
    }
  };

  const checkout = async () => {
    if (!items.length) return;
    if (!user) {
      router.replace('/(auth)/login' as any);
      return;
    }
    if (!user.ho_ten || !user.so_dien_thoai || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng bổ sung họ tên, số điện thoại và địa chỉ giao hàng');
      return;
    }

    setSubmitting(true);
    try {
      const response = await orderService.createOrder({
        ho_ten_nguoi_nhan: user.ho_ten,
        so_dien_thoai: user.so_dien_thoai,
        dia_chi_giao_hang: address.trim(),
        phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang',
        ghi_chu: note.trim() || undefined,
      });
      setItems([]);
      router.push({ pathname: '/modal', params: { orderId: String(response.data?.ma_don_hang || ''), total: String(response.data?.tong_tien || subtotal) } });
    } catch (error) {
      Alert.alert('Lỗi', getApiMessage(error, 'Không thể đặt hàng'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang chuẩn bị giỏ hàng..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <ScreenHeading eyebrow="GIỎ HÀNG CỦA BẠN" title="Sắp về với tổ ấm" subtitle={`${items.reduce((sum, item) => sum + Number(item.so_luong), 0)} sản phẩm đã chọn · Kiểm tra trước khi đặt hàng`} icon="shopping-bag" />

        {!items.length ? (
          <EmptyState icon="shopping-bag" title="Giỏ hàng chờ bạn chọn" message="Một món đồ nhỏ cũng có thể làm cuộc sống tiện nghi hơn." action="Khám phá sản phẩm" onAction={() => router.push('/products')} />
        ) : (
          <>
            {items.map((item) => (
              <View style={styles.item} key={item.ma_san_pham}>
                <ProductImage uri={item.hinh_anh} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={styles.itemName}>{item.ten_san_pham}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.gia_ban)}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable accessibilityLabel="Giảm số lượng" style={styles.qtyButton} onPress={() => changeQuantity(item, -1)}><MaterialIcons name="remove" size={18} color="#183C35" /></Pressable>
                    <Text style={styles.qtyText}>{item.so_luong}</Text>
                    <Pressable accessibilityLabel="Tăng số lượng" style={styles.qtyButton} onPress={() => changeQuantity(item, 1)}><MaterialIcons name="add" size={18} color="#183C35" /></Pressable>
                  </View>
                </View>
                <Pressable accessibilityLabel={`Xóa ${item.ten_san_pham}`} hitSlop={12} onPress={() => removeItem(item.ma_san_pham)}><MaterialIcons name="delete-outline" size={23} color="#84938B" /></Pressable>
              </View>
            ))}

            <View style={styles.form}>
              <View style={styles.formHeading}><MaterialIcons name="local-shipping" size={22} color="#176B52" /><Text style={styles.formTitle}>Giao đến địa chỉ của bạn</Text></View>
              <Text style={styles.deliveryNote}>{user?.ho_ten} · {user?.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder="Địa chỉ giao hàng" placeholderTextColor="#84938B" style={styles.input} />
              <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú cho đơn hàng" placeholderTextColor="#84938B" style={[styles.input, styles.note]} multiline />
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Chi tiết thanh toán</Text>
              <View style={styles.line}><Text style={styles.label}>Tạm tính</Text><Text style={styles.value}>{formatCurrency(subtotal)}</Text></View>
              <View style={styles.line}><Text style={styles.label}>Giao hàng</Text><Text style={styles.free}>Miễn phí</Text></View>
              <View style={[styles.line, styles.totalLine]}><Text style={styles.total}>Tổng cộng</Text><Text style={styles.total}>{formatCurrency(subtotal)}</Text></View>
              <Pressable style={[styles.checkout, submitting && styles.disabled]} onPress={checkout} disabled={submitting}>
                <Text style={styles.checkoutText}>{submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}</Text>
                <MaterialIcons name="arrow-forward" size={19} color="#fff" />
              </Pressable>
            <View style={styles.paymentNote}><MaterialIcons name="payments" size={18} color="#176B52" /><Text style={styles.deliveryNote}>Thanh toán khi nhận hàng</Text></View>
            </View>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  deliveryNote: { color: '#6D7D76', fontSize: 12, lineHeight: 19, marginBottom: 12 },
  summaryTitle: { color: '#183C35', fontSize: 17, fontWeight: '800', marginBottom: 22 },
  paymentNote: { flexDirection: 'row', gap: 8, alignItems: 'baseline', justifyContent: 'center', marginTop: 16 },
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, paddingBottom: 30, width: '100%', maxWidth: 760, alignSelf: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EAF0E7' },
  itemImage: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#EAF0E7' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#183C35', fontSize: 14, fontWeight: '800' },
  itemPrice: { color: '#176B52', fontSize: 15, fontWeight: '800', marginTop: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF2E9' },
  qtyText: { color: '#183C35', fontWeight: '800', minWidth: 20, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 22, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#EAF0E7' },
  formTitle: { color: '#183C35', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  input: { minHeight: 46, borderRadius: 15, borderWidth: 1, borderColor: '#E3E9E1', paddingHorizontal: 12, color: '#183C35', marginBottom: 10, backgroundColor: '#fff' },
  note: { minHeight: 78, textAlignVertical: 'top', paddingTop: 12 },
  summary: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginTop: 12, borderWidth: 1, borderColor: '#EAF0E7' },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  label: { color: '#6D7D76', fontSize: 13 },
  value: { color: '#183C35', fontSize: 13, fontWeight: '700' },
  free: { color: '#176B52', fontSize: 13, fontWeight: '800' },
  totalLine: { borderTopWidth: 1, borderTopColor: '#edf2f7', paddingTop: 15, marginTop: 2, marginBottom: 17 },
  total: { color: '#183C35', fontSize: 18, fontWeight: '800' },
  checkout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, backgroundColor: '#176B52', padding: 15, borderRadius: 10 },
  disabled: { opacity: 0.65 },
  checkoutText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
