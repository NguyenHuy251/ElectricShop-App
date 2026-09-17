import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from '../../services/order.service';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    try {
      const result = await orderService.getOrders();
      setOrders(result.data || []);
    } catch (error) {
      console.error('Load orders failed', error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Đơn hàng của tôi</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.ma_don_hang)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.heading}>Đơn #{item.ma_don_hang}</Text>
              <Text>Tổng tiền: {Number(item.tong_tien).toLocaleString()}đ</Text>
              <Text>Trạng thái: {item.trang_thai}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  heading: { fontWeight: '800', marginBottom: 6 },
});
