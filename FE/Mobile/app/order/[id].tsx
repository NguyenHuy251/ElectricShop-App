import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CancelOrderButton } from '../../components/cancel-order-button';
import { OrderProductReview } from '../../components/order-product-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState } from '../../components/shop-ui';
import { orderService } from '../../services/order.service';
import type { Order } from '../../types';
import { formatCurrency, formatDate, getApiMessage } from '../../utils/format';

const statusLabel: Record<string, string> = {
  ChoXacNhan: 'Chờ xác nhận',
  DaXacNhan: 'Đã xác nhận',
  DangGiao: 'Đang giao',
  DaGiao: 'Đã giao',
  DaHuy: 'Đã hủy',
};

const paymentLabel: Record<string, string> = {
  TienMat: 'Tiền mặt',
  ChuyenKhoan: 'Chuyển khoản',
  ThanhToanKhiNhanHang: 'Thanh toán khi nhận hàng',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router=useRouter();
  const [reordering,setReordering]=useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const version = useRef(0);

  const loadOrder = useCallback(async () => {
      const request = ++version.current;
      try {
        if (!/^\d+$/.test(id || '') || !Number.isSafeInteger(Number(id)) || Number(id) < 1) throw new Error('Invalid order');
        const response = await orderService.getOrderById(Number(id));
        if (request !== version.current) return;
        setOrder(response.data);
        setError('');
      } catch (error) {
        if (request !== version.current) return;
        setError(getApiMessage(error, 'Không thể tải chi tiết đơn hàng'));
      } finally {
        if (request === version.current) { setLoading(false); setRefreshing(false); }
      }
  }, [id]);
  useFocusEffect(useCallback(() => {
    setLoading(true); setOrder(null);
    void loadOrder();
    return () => { version.current++; };
  }, [loadOrder]));

  if (loading) {
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải chi tiết đơn hàng..." /></SafeAreaView>;
  }

  if (!order) {
    return <SafeAreaView style={styles.safe}><EmptyState icon="receipt-long" title="Không tìm thấy đơn hàng" message={error} action="Thử lại" onAction={loadOrder} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadOrder(); }} />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {error ? <Text accessibilityRole="alert" style={styles.date}>{error} · Kéo xuống để thử lại.</Text> : null}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>CHI TIẾT ĐƠN HÀNG</Text>
            <Text style={styles.title}>Đơn #{order.ma_don_hang}</Text>
            <Text style={styles.date}>{formatDate(order.ngay_dat)}</Text>
          </View>
          <View style={[styles.status, { backgroundColor: order.trang_thai === 'DaHuy' ? '#FBEDEC' : '#F8EEDB' }]}>
            <Text style={[styles.statusText, { color: order.trang_thai === 'DaHuy' ? '#BC4545' : '#916B24' }]}>{statusLabel[order.trang_thai] || order.trang_thai}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiến trình đơn hàng</Text>
          {['ChoXacNhan','DaXacNhan','DangGiao','DaGiao'].map((status,index)=>{
            const current=['ChoXacNhan','DaXacNhan','DangGiao','DaGiao'].indexOf(order.trang_thai);
            return <Text key={status} style={[styles.date,{color:index<=current?'#176B52':'#84938B'}]}>{index<=current?'●':'○'} {statusLabel[status]}{status===order.trang_thai?' · Hiện tại':''}</Text>;
          })}
          {order.trang_thai==='DaHuy'?<Text style={styles.date}>Đơn hàng đã hủy</Text>:null}
          <Pressable accessibilityRole="button" disabled={reordering} onPress={async()=>{if(reordering)return;setReordering(true);try{await api.post(`/shop/orders/${order.ma_don_hang}/reorder`);router.push('/cart');}catch(e){setError(getApiMessage(e,'Chưa thể mua lại đơn.'));}finally{setReordering(false);}}}><Text style={{color:'#176B52',fontWeight:'800'}}>{reordering?'Đang kiểm tra tồn kho...':'Mua lại theo giá hiện tại'}</Text></Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
          {(order.items || []).map((item: any, index: number) => (
            <View key={`${item.ma_san_pham}:${item.ma_bien_the || 0}`}>
            <View style={styles.item}>
              <View style={styles.itemIcon}><MaterialIcons name="inventory-2" size={20} color="#176B52" /></View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.ten_san_pham}</Text>
                {item.ten_bien_the ? <Text style={styles.itemMeta}>{item.ten_bien_the}</Text> : null}
                <Text style={styles.itemMeta}>{item.so_luong} x {formatCurrency(item.don_gia)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.thanh_tien || Number(item.don_gia) * Number(item.so_luong))}</Text>
            </View>
            {order.can_review && order.trang_thai === 'DaGiao' && order.items?.findIndex(line => line.ma_san_pham === item.ma_san_pham) === index ? <OrderProductReview key={JSON.stringify([order.ma_don_hang, item.ma_san_pham, order.reviews?.find(review => review.ma_san_pham === item.ma_san_pham)])} orderId={order.ma_don_hang} productId={item.ma_san_pham} review={order.reviews?.find(review => review.ma_san_pham === item.ma_san_pham)} /> : null}
            </View>
          ))}
          {order.trang_thai !== 'DaGiao' ? <Text style={styles.date}>{order.trang_thai === 'DaHuy' ? 'Đơn đã hủy không đủ điều kiện đánh giá.' : 'Bạn có thể đánh giá sản phẩm sau khi đơn được giao thành công.'}</Text> : null}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng thanh toán</Text><Text style={styles.total}>{formatCurrency(order.tong_tien)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <InfoRow icon="person-outline" label="Người nhận" value={order.ho_ten_nguoi_nhan} />
          <InfoRow icon="phone" label="Số điện thoại" value={order.so_dien_thoai} />
          <InfoRow icon="location-on" label="Địa chỉ" value={order.dia_chi_giao_hang} />
          <InfoRow icon="payments" label="Thanh toán" value={paymentLabel[order.phuong_thuc_thanh_toan] || order.phuong_thuc_thanh_toan} />
          {order.ghi_chu ? <InfoRow icon="notes" label="Ghi chú" value={order.ghi_chu} /> : null}
          {order.phuong_thuc_thanh_toan === 'ThanhToanKhiNhanHang' && order.trang_thai !== 'DaHuy' && order.trang_thai !== 'DaGiao' ? <Text style={styles.date}>Thanh toán cho nhân viên giao hàng khi nhận đơn.</Text> : null}
        </View>
        {order.trang_thai === 'ChoXacNhan' ? <CancelOrderButton orderId={order.ma_don_hang} onCanceled={() => setOrder({ ...order, trang_thai: 'DaHuy' })} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={19} color="#176B52" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, paddingBottom: 32, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  eyebrow: { color: '#176B52', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#183C35', fontSize: 25, fontWeight: '800', marginTop: 6 },
  date: { color: '#6D7D76', fontSize: 12, marginTop: 5 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  section: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#EAF0E7' },
  sectionTitle: { color: '#183C35', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2E9' },
  itemIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#E7F1E9', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { color: '#183C35', fontSize: 13, fontWeight: '700' },
  itemMeta: { color: '#6D7D76', fontSize: 12, marginTop: 4 },
  itemTotal: { color: '#176B52', fontSize: 13, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 2 },
  totalLabel: { color: '#6D7D76', fontSize: 13 },
  total: { color: '#183C35', fontSize: 19, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 9 },
  infoLabel: { color: '#6D7D76', fontSize: 12, width: 88 },
  infoValue: { color: '#183C35', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
});
