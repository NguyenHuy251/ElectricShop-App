import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '../utils/format';

export default function ModalScreen() {
  const { orderId, total } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.icon}><MaterialIcons name="check" size={34} color="#fff" /></View>
      <Text style={styles.title}>Đặt hàng thành công</Text>
      <Text style={styles.message}>Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.</Text>
      <View style={styles.card}>
        <View>
          <Text style={styles.label}>MÃ ĐƠN HÀNG</Text>
          <Text style={styles.orderNumber}>{orderId ? `#${orderId}` : 'Đang cập nhật'}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.label}>TỔNG TIỀN</Text>
          <Text style={styles.total}>{formatCurrency(String(total || 0))}</Text>
        </View>
      </View>
      <Link href="/orders" dismissTo style={styles.link}><Text style={styles.linkText}>Xem đơn hàng</Text></Link>
      <Link href="/" dismissTo style={styles.secondaryLink}><Text style={styles.secondaryText}>Về trang chủ</Text></Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 46 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A8A72', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#152238', fontSize: 27, fontWeight: '800', marginTop: 22 },
  message: { color: '#64748b', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 10 },
  card: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 15, padding: 18, marginTop: 28, borderWidth: 1, borderColor: '#eef2f7' },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  orderNumber: { color: '#152238', fontSize: 17, fontWeight: '800', marginTop: 5 },
  totalBox: { alignItems: 'flex-end' },
  total: { color: '#E76F51', fontSize: 17, fontWeight: '800', marginTop: 5 },
  link: { backgroundColor: '#E76F51', borderRadius: 10, width: '100%', alignItems: 'center', padding: 15, marginTop: 24 },
  linkText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryLink: { padding: 15, marginTop: 8 },
  secondaryText: { color: '#64748b', fontWeight: '800' },
});
