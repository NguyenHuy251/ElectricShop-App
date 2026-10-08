import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CancelOrderButton } from '../../components/cancel-order-button';
import { ConfirmReceiptButton } from '../../components/confirm-receipt-button';
import { OrderProductReview } from '../../components/order-product-review';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage } from '../../components/shop-ui';
import { orderService } from '../../services/order.service';
import type { Order, OrderItem } from '../../types';
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
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
          {(order.items || []).map((item, index: number) => (
            <View key={`${item.ma_san_pham}:${item.ma_bien_the || 0}`}>
            <View style={styles.item}>
              <ProductImage uri={item.hinh_anh} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.ten_san_pham}</Text>
                {item.ten_bien_the ? <Text style={styles.itemMeta}>{item.ten_bien_the}</Text> : null}
                <Text style={styles.itemMeta}>{item.so_luong} x {formatCurrency(item.don_gia)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.thanh_tien || Number(item.don_gia) * Number(item.so_luong))}</Text>
            </View>
            <OrderedProductDetails item={item} />
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
        {order.trang_thai === 'DangGiao' && order.can_confirm_receipt ? <ConfirmReceiptButton key={order.ma_don_hang} orderId={order.ma_don_hang} onConfirmed={() => {
          setOrder(current => current?.ma_don_hang === order.ma_don_hang ? { ...current, trang_thai: 'DaGiao', can_confirm_receipt: false, can_review: true } : current);
        }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderedProductDetails({ item }: { item: OrderItem }) {
  const [expanded, setExpanded] = useState(false);
  const details = item.product_details;
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Chi tiết ${item.ten_san_pham}, ${item.ten_bien_the || 'sản phẩm tiêu chuẩn'}`} accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={styles.detailButton}>
      <Text style={styles.detailButtonText}>{expanded ? 'Thu gọn chi tiết' : 'Xem chi tiết sản phẩm'}</Text>
      <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={20} color="#176B52" />
    </Pressable>
    {expanded ? <View style={styles.productDetails}>
      <Text style={styles.itemName}>Thông tin sản phẩm đã đặt</Text>
      <DetailRow label="Biến thể" value={item.ten_bien_the || 'Tiêu chuẩn'} />
      <DetailRow label="Số lượng" value={String(item.so_luong)} />
      <DetailRow label="Đơn giá khi đặt" value={formatCurrency(item.don_gia)} />
      <DetailRow label="Thành tiền" value={formatCurrency(item.thanh_tien ?? Number(item.don_gia) * item.so_luong)} />
      {details ? <>
        <Text style={styles.specHeading}>Thông tin danh mục hiện tại</Text>
        <DetailRow label="Mã sản phẩm" value={details.ma_san_pham_code || '—'} />
        {details.ma_sku ? <DetailRow label="SKU biến thể" value={details.ma_sku} /> : null}
        <DetailRow label="Danh mục" value={details.ten_danh_muc || '—'} />
        <DetailRow label="Thương hiệu" value={details.ten_thuong_hieu || '—'} />
        <DetailRow label="Bảo hành" value={details.bao_hanh == null ? '—' : `${details.bao_hanh} tháng`} />
        <Text style={styles.specHeading}>Thông số hiện tại của sản phẩm / biến thể</Text>
        {details.thong_so_ky_thuat.length ? details.thong_so_ky_thuat.map(spec => <DetailRow key={spec.ma_thong_so} label={spec.ten_thong_so} value={spec.gia_tri} />) : <Text style={styles.date}>Chưa có thông số kỹ thuật.</Text>}
      </> : <Text style={styles.date}>Sản phẩm không còn trong danh mục. Thông tin đã đặt vẫn được giữ trong đơn hàng.</Text>}
    </View> : null}
  </View>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.specRow}><Text style={styles.specLabel}>{label}</Text><Text style={styles.specValue}>{value}</Text></View>;
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
  itemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F6F7F2' },
  itemInfo: { flex: 1 },
  itemName: { color: '#183C35', fontSize: 13, fontWeight: '700' },
  itemMeta: { color: '#6D7D76', fontSize: 12, marginTop: 4 },
  itemTotal: { color: '#176B52', fontSize: 13, fontWeight: '800' },
  detailButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  detailButtonText: { fontSize: 12, color: '#176B52', fontWeight: '700' },
  productDetails: { padding: 14, borderRadius: 14, backgroundColor: '#F6F7F2', marginBottom: 12 },
  specHeading: { color: '#183C35', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  specRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E4EBE3' },
  specLabel: { flex: 1, color: '#6D7D76', fontSize: 12 },
  specValue: { flex: 1, textAlign: 'right', color: '#183C35', fontSize: 12, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 2 },
  totalLabel: { color: '#6D7D76', fontSize: 13 },
  total: { color: '#183C35', fontSize: 19, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 9 },
  infoLabel: { color: '#6D7D76', fontSize: 12, width: 88 },
  infoValue: { color: '#183C35', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
});
