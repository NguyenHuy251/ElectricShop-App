import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/order.service';
import type { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

const statusLabel: Record<string, string> = {
  ChoXacNhan: 'Chờ xác nhận',
  DaXacNhan: 'Đã xác nhận',
  DangGiao: 'Đang giao',
  DaGiao: 'Đã giao',
  DaHuy: 'Đã hủy',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setError('');
    try {
      const result = await orderService.getOrders();
      setOrders(result.data || []);
    } catch {
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]));

  const refresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>LỊCH SỬ</Text>
        <Text style={styles.title}>Đơn hàng</Text>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#E76F51" /><Text style={styles.muted}>Đang tải đơn hàng...</Text></View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.ma_don_hang)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={orders.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<Text style={error ? styles.error : styles.muted}>{error || 'Bạn chưa có đơn hàng nào'}</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.heading}>Đơn #{item.ma_don_hang}</Text>
                    <Text style={styles.date}>{formatDate((item as any).ngay_dat)}</Text>
                  </View>
                  <View style={styles.status}><Text style={styles.statusText}>{statusLabel[item.trang_thai] || item.trang_thai}</Text></View>
                </View>
                <View style={styles.infoLine}><MaterialIcons name="location-on" size={17} color="#64748b" /><Text numberOfLines={1} style={styles.infoText}>{item.dia_chi_giao_hang}</Text></View>
                <View style={styles.infoLine}><MaterialIcons name="inventory-2" size={17} color="#64748b" /><Text style={styles.infoText}>{item.items?.length || 0} sản phẩm</Text></View>
                <Text style={styles.total}>{formatCurrency(item.tong_tien)}</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginTop: 5, marginBottom: 18 },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#64748b', fontSize: 14 },
  error: { color: '#dc2626', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eef2f7' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  heading: { color: '#152238', fontWeight: '800', fontSize: 16 },
  date: { color: '#64748b', marginTop: 4, fontSize: 12 },
  status: { backgroundColor: '#fff1ec', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#E76F51', fontSize: 11, fontWeight: '800' },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  infoText: { color: '#64748b', flex: 1, fontSize: 13 },
  total: { color: '#152238', fontSize: 18, fontWeight: '800', marginTop: 13 },
});
