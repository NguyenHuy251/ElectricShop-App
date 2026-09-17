import { Link } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.icon}><MaterialIcons name="check" size={34} color="#FFF" /></View>
      <Text style={styles.title}>Đặt hàng thành công</Text>
      <Text style={styles.message}>Cảm ơn Alex. Đơn hàng của bạn đang được chuẩn bị và sẽ đến trong 2-4 ngày làm việc.</Text>
      <View style={styles.card}><View><Text style={styles.label}>MÃ ĐƠN HÀNG</Text><Text style={styles.orderNumber}>AE-240891</Text></View><MaterialIcons name="local-shipping" size={28} color="#E76F51" /></View>
      <Link href="/" dismissTo style={styles.link}><Text style={styles.linkText}>Về trang chủ</Text></Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#CBD2DA', marginBottom: 46 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A8A72', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#152238', fontSize: 27, fontWeight: '800', marginTop: 22 },
  message: { color: '#718094', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 10 },
  card: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 15, padding: 18, marginTop: 28 },
  label: { color: '#9AA5B4', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  orderNumber: { color: '#152238', fontSize: 16, fontWeight: '800', marginTop: 5 },
  link: { backgroundColor: '#E76F51', borderRadius: 10, width: '100%', alignItems: 'center', padding: 15, marginTop: 24 },
  linkText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
