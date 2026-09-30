import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState } from '../components/shop-ui';
import { orderService } from '../services/order.service';
import type { Order } from '../types';
import { formatCurrency, getApiMessage } from '../utils/format';

export default function CheckoutSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    const request = /^\d+$/.test(orderId || '') ? orderService.getOrderById(Number(orderId)) : Promise.reject(new Error('invalid order'));
    return request.then(({ data }) => {
      setOrder(data);
      setError('');
    }).catch(err => setError(getApiMessage(err, 'Không thể tải xác nhận đơn hàng. Bạn có thể xem lại trong mục Đơn hàng.')))
      .finally(() => setLoading(false));
  }, [orderId]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState message="Đang tải xác nhận đơn hàng..." />;
  if (!order || error) return <EmptyState icon="receipt-long" title="Kiểm tra đơn hàng" message={error} action="Xem đơn hàng" onAction={() => router.replace('/orders')} />;
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.icon}><MaterialIcons name="check" size={42} color="#fff" /></View>
    <Text style={styles.title}>{order.trang_thai === 'DaHuy' ? 'Đơn hàng đã hủy' : order.trang_thai === 'DaGiao' ? 'Đơn hàng đã giao' : 'Đã ghi nhận đơn hàng!'}</Text>
    <Text style={styles.message}>Cảm ơn bạn đã chọn Electric Shop. Theo dõi quá trình xử lý tại chi tiết đơn hàng.</Text>
    <View style={styles.card}>
      <Text style={styles.label}>MÃ ĐƠN HÀNG</Text><Text style={styles.order}>#{order.ma_don_hang}</Text>
      <Text style={styles.label}>GIÁ TRỊ ĐƠN HÀNG</Text><Text style={styles.total}>{formatCurrency(order.tong_tien)}</Text>
      <Text style={styles.message}>{order.trang_thai === 'DaHuy' ? 'Đơn này đã hủy. Bạn không cần thanh toán cho đơn hàng này.' : order.trang_thai === 'DaGiao' ? 'Đơn đã giao thành công. Bạn có thể đánh giá sản phẩm trong chi tiết đơn hàng.' : order.phuong_thuc_thanh_toan === 'ThanhToanKhiNhanHang' ? 'Bạn sẽ trả tiền cho nhân viên giao hàng khi nhận đơn. Cửa hàng sẽ liên hệ để xác nhận thông tin giao hàng.' : 'Xem phương thức thanh toán trong chi tiết đơn hàng.'}</Text>
      <View style={styles.divider} /><Text style={styles.order}>{order.ho_ten_nguoi_nhan} · {order.so_dien_thoai}</Text><Text style={styles.message}>{order.dia_chi_giao_hang}</Text>
    </View>
    <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.replace({ pathname: '/order/[id]', params: { id: String(order.ma_don_hang) } })}><Text style={styles.buttonText}>Xem chi tiết đơn hàng</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/products')}><Text style={styles.secondary}>Tiếp tục mua sắm</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' },
  icon: { width: 96, height: 96, borderRadius: 32, backgroundColor: '#176B52', alignItems: 'center', justifyContent: 'center' }, title: { color: '#183C35', fontSize: 27, fontWeight: '800', textAlign: 'center' }, message: { color: '#6D7D76', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 22, width: '100%', alignItems: 'center', gap: 12 }, label: { color: '#6D7D76', fontSize: 10, letterSpacing: 1, fontWeight: '700' }, order: { color: '#183C35', fontWeight: '700', textAlign: 'center', fontSize: 15 }, total: { color: '#176B52', fontSize: 28, fontWeight: '800' }, divider: { height: 1, backgroundColor: '#EAF0E7', width: '100%', marginVertical: 8 },
  button: { backgroundColor: '#176B52', minHeight: 52, padding: 16, borderRadius: 14, width: '100%', alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, secondary: { color: '#176B52', fontWeight: '700', padding: 14 },
});
