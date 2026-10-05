import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '@/services/api';
import { formatCurrency, formatDate, getApiMessage } from '@/utils/format';
export type CustomerVoucher = { code: string; loai: string; gia_tri: number; don_toi_thieu: number; giam_toi_da: number | null; ket_thuc: string; can_use?: boolean | number };
export function VoucherList({ onSelect, subtotal }: { onSelect: (code: string) => void; subtotal?: number }) {
  const [items, setItems] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/voucher/available'); setItems(response.data.data || []); }
    catch (e) { setError(getApiMessage(e, 'Không thể tải danh sách mã giảm giá.')); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.empty}><ActivityIndicator color="#176B52" /><Text>Đang tải mã giảm giá...</Text></View>;
  if (error) return <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Thử lại</Text></Pressable></View>;
  return <ScrollView contentContainerStyle={styles.list}>
    <Text style={styles.description}>Chọn một mã cho đơn hàng. Điều kiện và lượt còn lại được kiểm tra khi đặt hàng.</Text>
    {!items.length ? <View style={styles.empty}><MaterialIcons name="local-offer" size={42} color="#176B52" /><Text style={styles.title}>Chưa có mã khả dụng</Text><Text style={styles.description}>Mã có thể đã hết hạn hoặc bạn đã dùng hết lượt.</Text></View> : null}
    {items.map(v => {
      const customer = v.can_use === undefined || Boolean(v.can_use);
      const eligible = customer && (subtotal === undefined || subtotal >= Number(v.don_toi_thieu));
      return <View key={v.code} style={styles.ticket}>
        <View style={styles.heading}><MaterialIcons name="local-offer" size={26} color="#176B52" /><Text style={styles.title}>Giảm {v.loai === 'PhanTram' ? `${Number(v.gia_tri)}%` : formatCurrency(v.gia_tri)}</Text></View>
        <Text selectable style={styles.code}>{v.code}</Text>
        <Text style={styles.description}>Đơn từ {formatCurrency(v.don_toi_thieu)}{v.giam_toi_da ? ` · Giảm tối đa ${formatCurrency(v.giam_toi_da)}` : ''}</Text>
        <Text style={styles.description}>Hết hạn: {formatDate(v.ket_thuc)}</Text>
        {customer && !eligible ? <Text style={styles.error}>Mua thêm {formatCurrency(Number(v.don_toi_thieu) - (subtotal || 0))} để dùng mã này.</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={`Chọn mã ${v.code}`} disabled={!eligible} onPress={() => onSelect(v.code)} style={[styles.button, !eligible && { opacity: 0.45 }]}><Text style={styles.buttonText}>{!customer ? 'Dành cho tài khoản khách hàng' : eligible ? 'Chọn mã này' : 'Chưa đủ điều kiện'}</Text></Pressable>
      </View>;
    })}
    <Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Làm mới danh sách</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  list: { padding: 20, gap: 14, paddingBottom: 32 },
  ticket: { padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#DCE8DF', backgroundColor: '#fff', gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#183C35' },
  code: { fontSize: 16, fontWeight: '800', color: '#176B52', letterSpacing: 1 },
  description: { color: '#61766A', fontSize: 13, lineHeight: 20 },
  error: { color: '#B33D3D', fontSize: 13 },
  button: { backgroundColor: '#176B52', borderRadius: 12, padding: 13, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { color: '#176B52', fontWeight: '700', paddingVertical: 12 },
  empty: { padding: 24, alignItems: 'center', gap: 14 },
});
