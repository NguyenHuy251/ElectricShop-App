import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoucherCard } from '../components/voucher-card';
import { LoadingState } from '../components/shop-ui';
import { voucherService, type CustomerVoucher } from '../services/voucher.service';
import { getApiMessage } from '../utils/format';
export default function VouchersScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setVouchers(await voucherService.getMine()); }
    catch (err) { setError(getApiMessage(err, 'Không thể tải voucher.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <SafeAreaView style={styles.safe} edges={['bottom']}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Voucher của tôi</Text>
      <Text style={styles.detail}>Các mã cửa hàng đang phát hành cho tài khoản của bạn. Chọn mã phù hợp với đơn hàng ở trang thanh toán.</Text>
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load()}><Text style={styles.link}>Làm mới voucher</Text></Pressable>
      {loading ? <LoadingState message="Đang tải voucher..." /> : error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : vouchers.length ? vouchers.map(v => <VoucherCard key={v.ma_voucher} voucher={v} />) : <View style={styles.empty}><Text style={styles.detail}>Hiện chưa có voucher còn hiệu lực. Bạn có thể quay lại sau để xem ưu đãi mới.</Text></View>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/products')} style={styles.button}><Text style={styles.buttonText}>Tiếp tục mua sắm</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { padding: 20, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  title: { color: '#183C35', fontSize: 26, fontWeight: '800' }, detail: { color: '#6D7D76', fontSize: 13, lineHeight: 21 },
  link: { color: '#176B52', fontWeight: '700', paddingVertical: 8 }, error: { color: '#A52D2D' }, empty: { padding: 20, backgroundColor: '#fff', borderRadius: 16 },
  button: { padding: 16, alignItems: 'center', backgroundColor: '#176B52', borderRadius: 14 }, buttonText: { color: '#fff', fontWeight: '700' },
});
