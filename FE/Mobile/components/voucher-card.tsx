import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CustomerVoucher } from '../services/voucher.service';
import { formatCurrency, formatDate } from '../utils/format';
export function VoucherCard({ voucher, selected, disabled, onSelect }: {
  voucher: CustomerVoucher; selected?: boolean; disabled?: boolean; onSelect?: () => void;
}) {
  return <View style={[styles.card, selected && styles.selected]}>
    <Text style={styles.code}>{voucher.ma_code}</Text>
    <Text style={styles.discount}>Giảm {voucher.loai === 'PhanTram' ? `${voucher.giam_tien}%` : formatCurrency(voucher.giam_tien)}{voucher.giam_toi_da != null ? ` · Tối đa ${formatCurrency(voucher.giam_toi_da)}` : ''}</Text>
    <Text style={styles.detail}>Đơn từ {formatCurrency(voucher.don_toi_thieu)} · Hết hạn {formatDate(voucher.ket_thuc)}</Text>
    {voucher.ly_do ? <Text style={styles.reason}>{voucher.ly_do}</Text> : null}
    {onSelect ? <Pressable accessibilityRole="button" accessibilityLabel={`Chọn voucher ${voucher.ma_code}`} accessibilityState={{ disabled: disabled || !voucher.co_the_dung, selected }} disabled={disabled || !voucher.co_the_dung} onPress={onSelect} style={[styles.button, (disabled || !voucher.co_the_dung) && styles.disabled]}>
      <Text style={styles.buttonText}>{selected ? 'Đang áp dụng' : 'Chọn voucher'}</Text>
    </Pressable> : <Text style={styles.status}>{voucher.co_the_dung ? 'Có thể sử dụng khi thanh toán' : 'Chưa thể sử dụng'}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 16, gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 16 },
  selected: { borderColor: '#176B52', backgroundColor: '#F0F8F1' }, code: { fontSize: 16, fontWeight: '800', color: '#183C35' },
  discount: { fontSize: 17, fontWeight: '700', color: '#176B52' }, detail: { fontSize: 12, lineHeight: 20, color: '#6D7D76' },
  reason: { fontSize: 12, lineHeight: 20, color: '#A52D2D' }, status: { fontSize: 12, color: '#176B52' },
  button: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#176B52' },
  disabled: { opacity: 0.45 }, buttonText: { color: '#fff', fontWeight: '700' },
});
