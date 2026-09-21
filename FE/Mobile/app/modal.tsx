import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '../utils/format';

export default function ModalScreen() {
  const { orderId, total } = useLocalSearchParams();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7F2' }}><ScrollView contentContainerStyle={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.eyebrow}>CẢM ƠN BẠN ĐÃ LỰA CHỌN</Text>
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
    </ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#176B52', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 28 },
  container: { flexGrow: 1, alignItems: 'center', backgroundColor: '#F6F7F2', padding: 24, justifyContent: 'center', width: '100%', maxWidth: 540, alignSelf: 'center' },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 46 },
  icon: { width: 100, height: 100, borderRadius: 36, borderWidth: 10, borderColor: '#E0ECD8', backgroundColor: '#176B52', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#183C35', fontSize: 27, fontWeight: '800', marginTop: 22, textAlign: 'center' },
  message: { color: '#6D7D76', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 10 },
  card: { width: '100%', gap: 22, alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, padding: 18, marginTop: 28, borderWidth: 1, borderColor: '#EAF0E7' },
  label: { color: '#84938B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  orderNumber: { textAlign: 'center', color: '#183C35', fontSize: 17, fontWeight: '800', marginTop: 5 },
  totalBox: { alignItems: 'center' },
  total: { color: '#176B52', fontSize: 17, fontWeight: '800', marginTop: 5 },
  link: { backgroundColor: '#176B52', borderRadius: 15, width: '100%', alignItems: 'center', padding: 15, marginTop: 24 },
  linkText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryLink: { padding: 15, marginTop: 8 },
  secondaryText: { color: '#6D7D76', fontWeight: '800' },
});
