import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color="#E76F51" /><Text style={styles.muted}>Đang tải giỏ hàng...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <Text style={styles.kicker}>GIỎ HÀNG</Text>
        <Text style={styles.title}>Sản phẩm đã chọn</Text>

        {!items.length ? (
          <View style={styles.empty}>
            <MaterialIcons name="shopping-cart" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
            <Pressable style={styles.shopButton} onPress={() => router.push('/products' as any)}><Text style={styles.shopButtonText}>Mua sắm ngay</Text></Pressable>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View style={styles.item} key={item.ma_san_pham}>
                <Image source={{ uri: item.hinh_anh || 'https://via.placeholder.com/160x160.png?text=No+Image' }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={styles.itemName}>{item.ten_san_pham}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.gia_ban)}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item, -1)}><MaterialIcons name="remove" size={18} color="#152238" /></Pressable>
                    <Text style={styles.qtyText}>{item.so_luong}</Text>
                    <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item, 1)}><MaterialIcons name="add" size={18} color="#152238" /></Pressable>
                  </View>
                </View>
                <Pressable onPress={() => removeItem(item.ma_san_pham)}><MaterialIcons name="delete-outline" size={23} color="#94a3b8" /></Pressable>
              </View>
            ))}

            <View style={styles.form}>
              <Text style={styles.formTitle}>Thông tin giao hàng</Text>
              <TextInput value={address} onChangeText={setAddress} placeholder="Địa chỉ giao hàng" placeholderTextColor="#94a3b8" style={styles.input} />
              <TextInput value={note} onChangeText={setNote} placeholder="Ghi chú cho đơn hàng" placeholderTextColor="#94a3b8" style={[styles.input, styles.note]} multiline />
            </View>

            <View style={styles.summary}>
              <View style={styles.line}><Text style={styles.label}>Tạm tính</Text><Text style={styles.value}>{formatCurrency(subtotal)}</Text></View>
              <View style={styles.line}><Text style={styles.label}>Giao hàng</Text><Text style={styles.free}>Miễn phí</Text></View>
              <View style={[styles.line, styles.totalLine]}><Text style={styles.total}>Tổng cộng</Text><Text style={styles.total}>{formatCurrency(subtotal)}</Text></View>
              <Pressable style={[styles.checkout, submitting && styles.disabled]} onPress={checkout} disabled={submitting}>
                <Text style={styles.checkoutText}>{submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}</Text>
                <MaterialIcons name="arrow-forward" size={19} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 30 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginTop: 5, marginBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#64748b' },
  empty: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: '#152238', fontSize: 18, fontWeight: '800' },
  shopButton: { backgroundColor: '#E76F51', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  shopButtonText: { color: '#fff', fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f7' },
  itemImage: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#eef2f7' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: '#152238', fontSize: 14, fontWeight: '800' },
  itemPrice: { color: '#E76F51', fontSize: 15, fontWeight: '800', marginTop: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyButton: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  qtyText: { color: '#152238', fontWeight: '800', minWidth: 20, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#eef2f7' },
  formTitle: { color: '#152238', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  input: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, color: '#152238', marginBottom: 10, backgroundColor: '#fff' },
  note: { minHeight: 78, textAlignVertical: 'top', paddingTop: 12 },
  summary: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginTop: 12, borderWidth: 1, borderColor: '#eef2f7' },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13 },
  label: { color: '#64748b', fontSize: 13 },
  value: { color: '#152238', fontSize: 13, fontWeight: '700' },
  free: { color: '#1A8A72', fontSize: 13, fontWeight: '800' },
  totalLine: { borderTopWidth: 1, borderTopColor: '#edf2f7', paddingTop: 15, marginTop: 2, marginBottom: 17 },
  total: { color: '#152238', fontSize: 18, fontWeight: '800' },
  checkout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, backgroundColor: '#E76F51', padding: 15, borderRadius: 10 },
  disabled: { opacity: 0.65 },
  checkoutText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
