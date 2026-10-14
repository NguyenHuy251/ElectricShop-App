import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoucherCard } from '../components/voucher-card';
import { LoadingState } from '../components/shop-ui';
import { voucherService, type CustomerVoucher } from '../services/voucher.service';
import { getApiMessage } from '../utils/format';

type TabType = 'all' | 'usable' | 'wallet';

export default function VouchersScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Promo code claim state
  const [inputCode, setInputCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setVouchers(await voucherService.getMine());
    } catch (err) {
      setError(getApiMessage(err, 'Không thể tải voucher.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleClaim = async () => {
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá.');
      return;
    }
    Keyboard.dismiss();
    setClaiming(true);
    try {
      const res = await voucherService.claim(trimmed);
      Alert.alert('Thành công 🎉', res.message || 'Đã lưu voucher vào ví thành công!');
      setInputCode('');
      await load();
    } catch (err) {
      Alert.alert('Không thể lưu mã', getApiMessage(err, 'Mã không tồn tại hoặc không đủ điều kiện.'));
    } finally {
      setClaiming(false);
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    if (activeTab === 'usable') return v.co_the_dung;
    if (activeTab === 'wallet') return !v.la_cong_khai;
    return true;
  });

  const walletCount = vouchers.filter(v => !v.la_cong_khai).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>KHO ƯU ĐÃI & VÍ VOUCHER</Text>
          <Text style={styles.title}>Voucher của bạn</Text>
          <Text style={styles.detail}>
            Quản lý mã giảm giá toàn sàn và voucher cá nhân nhận được từ điểm danh, giới thiệu và đổi xu.
          </Text>
        </View>

        {/* Claim Promo Code Box */}
        <View style={styles.claimBox}>
          <View style={styles.claimInputWrap}>
            <MaterialIcons name="confirmation-number" size={20} color="#176B52" />
            <TextInput
              style={styles.claimInput}
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="Nhập mã ưu đãi (Ví dụ: ESHOP20K...)"
              placeholderTextColor="#84938B"
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleClaim}
            />
          </View>
          <Pressable
            style={[styles.claimBtn, claiming && styles.btnDisabled]}
            disabled={claiming}
            onPress={handleClaim}
          >
            <Text style={styles.claimBtnText}>{claiming ? 'Đang lưu...' : 'Lưu mã'}</Text>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Tất cả ({vouchers.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'usable' && styles.tabItemActive]}
            onPress={() => setActiveTab('usable')}
          >
            <Text style={[styles.tabText, activeTab === 'usable' && styles.tabTextActive]}>
              Khả dụng ({vouchers.filter(v => v.co_the_dung).length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'wallet' && styles.tabItemActive]}
            onPress={() => setActiveTab('wallet')}
          >
            <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>
              Ví của tôi ({walletCount})
            </Text>
          </Pressable>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <Pressable accessibilityRole="button" disabled={loading} onPress={() => void load()}>
            <Text style={styles.refreshLink}>Làm mới danh sách</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/rewards' as any)} style={styles.rewardLinkWrap}>
            <MaterialIcons name="stars" size={16} color="#176B52" />
            <Text style={styles.rewardLink}>Săn thêm Voucher</Text>
          </Pressable>
        </View>

        {/* Voucher List */}
        {loading ? (
          <LoadingState message="Đang tải voucher..." />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
        ) : filteredVouchers.length ? (
          <View style={styles.voucherList}>
            {filteredVouchers.map(v => (
              <VoucherCard key={v.ma_voucher} voucher={v} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <MaterialIcons name="local-offer" size={40} color="#BAC6BF" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'wallet' ? 'Ví voucher riêng của bạn đang trống' : 'Chưa có voucher phù hợp'}
            </Text>
            <Text style={styles.emptyDetail}>
              {activeTab === 'wallet'
                ? 'Hãy tham gia điểm danh hàng ngày hoặc giới thiệu bạn bè để nhận voucher độc quyền nhé!'
                : 'Hiện chưa có voucher còn hiệu lực trong mục này. Bạn có thể quay lại sau để xem ưu đãi mới.'}
            </Text>
            <Pressable
              style={styles.earnBtn}
              onPress={() => router.push('/rewards' as any)}
            >
              <Text style={styles.earnBtnText}>Đến trang Điểm danh & Nhận thưởng</Text>
            </Pressable>
          </View>
        )}

        {/* Continue Shopping button */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/products')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Khám phá sản phẩm mua sắm</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F7F2',
  },
  content: {
    padding: 20,
    gap: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#176B52',
    letterSpacing: 1.2,
  },
  title: {
    color: '#183C35',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detail: {
    color: '#6D7D76',
    fontSize: 13,
    lineHeight: 20,
  },
  claimBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  claimInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimInput: {
    flex: 1,
    fontSize: 13,
    color: '#183C35',
    fontWeight: '700',
    minHeight: 40,
  },
  claimBtn: {
    backgroundColor: '#176B52',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#EAF0E8',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D7D76',
  },
  tabTextActive: {
    color: '#183C35',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  refreshLink: {
    color: '#176B52',
    fontWeight: '700',
    fontSize: 12,
  },
  rewardLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardLink: {
    color: '#176B52',
    fontWeight: '700',
    fontSize: 12,
  },
  voucherList: {
    gap: 12,
  },
  error: {
    color: '#A52D2D',
    fontSize: 13,
  },
  empty: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2EBE2',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#183C35',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyDetail: {
    fontSize: 12,
    color: '#6D7D76',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  earnBtn: {
    marginTop: 8,
    backgroundColor: '#EAF8F0',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  earnBtnText: {
    color: '#176B52',
    fontWeight: '800',
    fontSize: 12,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#176B52',
    borderRadius: 16,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
