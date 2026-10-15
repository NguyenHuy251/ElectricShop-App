import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CustomerVoucher } from '../services/voucher.service';
import { formatCurrency, formatDate } from '../utils/format';

export function VoucherCard({ voucher, selected, disabled, onSelect }: {
  voucher: CustomerVoucher;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const isPercent = voucher.loai === 'PhanTram';
  const discountText = isPercent
    ? `Giảm ${voucher.giam_tien}%`
    : `Giảm ${formatCurrency(voucher.giam_tien)}`;
  const capText = voucher.giam_toi_da != null ? ` (Tối đa ${formatCurrency(voucher.giam_toi_da)})` : '';
  const isFreeship = voucher.ma_code.includes('FREESHIP');

  return (
    <View style={[styles.card, selected && styles.selectedCard, !voucher.co_the_dung && styles.cardDisabled]}>
      {/* Left colored coupon stub */}
      <View style={[styles.couponStub, isFreeship ? styles.stubFreeship : styles.stubDiscount]}>
        <MaterialIcons
          name={isFreeship ? 'local-shipping' : 'local-offer'}
          size={24}
          color="#183C35"
        />
        <Text style={styles.stubLabel}>{isFreeship ? 'FREESHIP' : 'GIẢM GIÁ'}</Text>
      </View>

      {/* Main coupon content */}
      <View style={styles.couponBody}>
        <View style={styles.headerRow}>
          <View style={styles.codeWrap}>
            <Text style={styles.codeText}>{voucher.ma_code}</Text>
            {(voucher.so_luong ?? 1) > 1 ? (
              <View style={styles.badgeQty}>
                <Text style={styles.badgeQtyText}>x{voucher.so_luong} lượt</Text>
              </View>
            ) : null}
            {voucher.nguon_goc ? (
              <View style={[styles.badge, voucher.la_cong_khai ? styles.badgePublic : styles.badgePrivate]}>
                <Text style={styles.badgeText}>{voucher.nguon_goc}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.discountText}>{discountText}{capText}</Text>

        {voucher.mo_ta ? (
          <Text style={styles.descText} numberOfLines={2}>{voucher.mo_ta}</Text>
        ) : null}

        <View style={styles.conditionRow}>
          <Text style={styles.detailText}>Đơn tối thiểu: {formatCurrency(voucher.don_toi_thieu)}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.detailText}>HSD: {formatDate(voucher.ket_thuc)}</Text>
        </View>

        {voucher.ly_do ? (
          <View style={styles.reasonWrap}>
            <MaterialIcons name="info-outline" size={14} color="#A52D2D" />
            <Text style={styles.reasonText}>{voucher.ly_do}</Text>
          </View>
        ) : null}

        {onSelect ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chọn voucher ${voucher.ma_code}`}
            accessibilityState={{ disabled: disabled || !voucher.co_the_dung, selected }}
            disabled={disabled || !voucher.co_the_dung}
            onPress={onSelect}
            style={[
              styles.button,
              selected ? styles.buttonSelected : styles.buttonNormal,
              (disabled || !voucher.co_the_dung) && styles.buttonDisabled,
            ]}
          >
            <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
              {selected ? 'Đang áp dụng' : 'Áp dụng mã'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.statusFooter}>
            <MaterialIcons
              name={voucher.co_the_dung ? 'check-circle' : 'schedule'}
              size={14}
              color={voucher.co_the_dung ? '#176B52' : '#84938B'}
            />
            <Text style={[styles.statusText, !voucher.co_the_dung && styles.statusMuted]}>
              {voucher.co_the_dung ? 'Sẵn sàng dùng khi thanh toán' : 'Chưa đủ điều kiện sử dụng'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  selectedCard: {
    borderColor: '#176B52',
    borderWidth: 1.5,
    backgroundColor: '#FAFCFA',
  },
  cardDisabled: {
    opacity: 0.85,
    backgroundColor: '#FAFBF9',
  },
  couponStub: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#E2EBE2',
    borderStyle: 'dashed',
  },
  stubDiscount: {
    backgroundColor: '#EAF8F0',
  },
  stubFreeship: {
    backgroundColor: '#EAF5FF',
  },
  stubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#183C35',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  couponBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#183C35',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePublic: {
    backgroundColor: '#EDF5EB',
  },
  badgePrivate: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#183C35',
  },
  badgeQty: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#D7F0E4',
  },
  badgeQtyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#176B52',
  },
  discountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#176B52',
  },
  descText: {
    fontSize: 12,
    color: '#596C62',
    lineHeight: 17,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#6D7D76',
  },
  dot: {
    fontSize: 11,
    color: '#BAC6BF',
  },
  reasonWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 11,
    color: '#A52D2D',
    fontWeight: '600',
    flex: 1,
  },
  button: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 6,
  },
  buttonNormal: {
    backgroundColor: '#176B52',
  },
  buttonSelected: {
    backgroundColor: '#EAF8F0',
    borderWidth: 1,
    borderColor: '#176B52',
  },
  buttonDisabled: {
    backgroundColor: '#E5ECE7',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonTextSelected: {
    color: '#176B52',
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#176B52',
  },
  statusMuted: {
    color: '#84938B',
  },
});
