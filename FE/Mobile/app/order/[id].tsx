import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState } from '@/components/shop-ui';
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
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await orderService.getOrderById(Number(id));
        setOrder(response.data);
      } catch (error) {
        Alert.alert('Lỗi', getApiMessage(error, 'Không thể tải chi tiết đơn hàng'));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải chi tiết đơn hàng..." /></SafeAreaView>;
  }

  if (!order) {
    return <SafeAreaView style={styles.safe}><EmptyState icon="receipt-long" title="Không tìm thấy đơn hàng" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
          {(order.items || []).map((item: any) => (
            <View style={styles.item} key={item.ma_san_pham}>
              <View style={styles.itemIcon}><MaterialIcons name="inventory-2" size={20} color="#176B52" /></View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.ten_san_pham}</Text>
                <Text style={styles.itemMeta}>{item.so_luong} x {formatCurrency(item.don_gia)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.thanh_tien || Number(item.don_gia) * Number(item.so_luong))}</Text>
            </View>
          ))}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng thanh toán</Text><Text style={styles.total}>{formatCurrency(order.tong_tien)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <InfoRow icon="person-outline" label="Người nhận" value={order.ho_ten_nguoi_nhan} />
          <InfoRow icon="phone" label="Số điện thoại" value={order.so_dien_thoai} />
          <InfoRow icon="location-on" label="Địa chỉ" value={order.dia_chi_giao_hang} />
          <InfoRow icon="payments" label="Thanh toán" value={paymentLabel[order.phuong_thuc_thanh_toan] || order.phuong_thuc_thanh_toan} />
          {order.ghi_chu ? <InfoRow icon="notes" label="Ghi chú" value={order.ghi_chu} /> : null}
        </View>
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
