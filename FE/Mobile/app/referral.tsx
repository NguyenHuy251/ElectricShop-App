import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState } from '../components/shop-ui';
import {
  rewardsService,
  type RewardsStatus,
} from '../services/rewards.service';
import { getApiMessage } from '../utils/format';

export default function ReferralScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<RewardsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralInput, setReferralInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await rewardsService.getStatus();
      setStatus(data);
    } catch (err) {
      Alert.alert('Thông báo', getApiMessage(err, 'Chưa tải được thông tin giới thiệu.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const myCode = status?.ma_gioi_thieu || '';

  const handleCopyCode = () => {
    if (!myCode) return;
    Alert.alert('Đã sao chép mã!', `Mã giới thiệu "${myCode}" đã được sao chép. Bạn có thể gửi cho bạn bè ngay!`);
  };

  const handleShare = async () => {
    if (!myCode) return;
    try {
      await Share.share({
        title: 'Mời bạn trải nghiệm Electric Shop',
        message: `Tải ngay app Electric Shop - Thiết bị gia dụng chính hãng! Nhập mã giới thiệu "${myCode}" để nhận ngay Voucher 50.000đ và 500 Xu thưởng cho đơn hàng đầu tiên!`,
      });
    } catch {
      // ignore
    }
  };

  const handleSubmitReferral = async () => {
    if (!referralInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã giới thiệu của bạn bè.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await rewardsService.enterReferral(referralInput.trim());
      Alert.alert(
        '🎉 Nhận quà thành công!',
        `Bạn đã kết nối thành công với ${res.nguoi_gioi_thieu}!\nBạn nhận được: +${res.diem_nhan} Xu và Voucher tân thủ "${res.voucher_tan_thu}" trị giá 50.000đ!`,
        [
          { text: 'Xem kho Voucher', onPress: () => router.push('/vouchers') },
          { text: 'OK', style: 'cancel' },
        ]
      );
      setReferralInput('');
      void loadData();
    } catch (err) {
      Alert.alert('Lỗi', getApiMessage(err, 'Mã giới thiệu không hợp lệ.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !status) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Đang nạp thông tin giới thiệu..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Promotional Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>CHƯƠNG TRÌNH ĐỒNG HÀNH</Text>
            </View>
            <Text style={styles.heroTitle}>Mời bạn cùng vui,{'\n'}Nhận quà 50.000đ</Text>
            <Text style={styles.heroSubtitle}>
              Chia sẻ mã mời đến bạn bè và người thân. Cả hai cùng nhận ngay 500 Xu và Voucher giảm 50.000đ mua sắm thiết bị gia dụng!
            </Text>
          </View>

          {/* My Referral Code Box */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>MÃ GIỚI THIỆU CỦA BẠN</Text>
            <Text style={styles.cardDesc}>Gửi mã này cho bạn bè để nhận thưởng khi họ tham gia.</Text>

            <View style={styles.codeContainer}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{myCode || 'Đang cập nhật'}</Text>
              </View>
              <Pressable style={styles.copyBtn} onPress={handleCopyCode}>
                <MaterialIcons name="content-copy" size={20} color="#183C35" />
                <Text style={styles.copyBtnText}>Sao chép</Text>
              </Pressable>
            </View>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="#183C35" />
              <Text style={styles.shareBtnText}>CHIA SẺ LỜI MỜI CHO BẠN BÈ</Text>
            </Pressable>
          </View>

          {/* Enter Referral Code Box */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>NHẬP MÃ TỪ BẠN BÈ</Text>
            <Text style={styles.cardDesc}>Nhập mã mời của người đã giới thiệu bạn để nhận ngay Voucher 50.000đ và +500 Xu.</Text>

            {status?.da_nhap_ma_moi ? (
              <View style={styles.alreadyEnteredCard}>
                <MaterialIcons name="check-circle" size={26} color="#176B52" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alreadyEnteredTitle}>Đã nhận quà giới thiệu</Text>
                  <Text style={styles.alreadyEnteredDesc}>Tài khoản của bạn đã kích hoạt quà tân thủ và kết nối thành công.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã giới thiệu (VD: ESHOP123)"
                  placeholderTextColor="#8C9E95"
                  autoCapitalize="characters"
                  value={referralInput}
                  onChangeText={setReferralInput}
                />
                <Pressable
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  onPress={handleSubmitReferral}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>{submitting ? '...' : 'Nhận quà'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={26} color="#176B52" />
              <Text style={styles.statNumber}>{status?.so_ban_be_da_moi || 0}</Text>
              <Text style={styles.statLabel}>Bạn bè đã mời</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="bitcoin" size={26} color="#B58000" />
              <Text style={styles.statNumber}>+{(status?.tong_thuong_gioi_thieu || 0).toLocaleString('vi-VN')}</Text>
              <Text style={styles.statLabel}>Xu đã tích lũy</Text>
            </View>
          </View>

          {/* 3 Steps Guide */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>3 BƯỚC NHẬN THƯỞNG DỄ DÀNG</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Gửi mã giới thiệu</Text>
                <Text style={styles.stepDesc}>Chia sẻ mã mời của bạn qua Zalo, Messenger, SMS cho bạn bè tải app.</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Bạn bè nhập mã</Text>
                <Text style={styles.stepDesc}>Người được mời nhập mã tại mục này để mở khóa quà tặng tân thủ.</Text>
              </View>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Cùng nhận quà 50.000đ</Text>
                <Text style={styles.stepDesc}>Cả hai cùng nhận ngay 500 Xu thưởng và Voucher 50.000đ mua sắm thỏa thích!</Text>
              </View>
            </View>
          </View>

          {/* Back to Rewards */}
          <Pressable style={styles.rewardsLink} onPress={() => router.push('/rewards' as any)}>
            <MaterialIcons name="military-tech" size={20} color="#176B52" />
            <Text style={styles.rewardsLinkText}>Đến Trung tâm Điểm thưởng & Đổi quà</Text>
            <MaterialIcons name="chevron-right" size={20} color="#176B52" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 18, paddingBottom: 36, maxWidth: 760, width: '100%', alignSelf: 'center', gap: 18 },

  heroCard: {
    backgroundColor: '#183C35',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(221, 243, 163, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroBadgeText: { color: '#DDF3A3', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5 },
  heroSubtitle: { color: '#C8D7CE', fontSize: 12, lineHeight: 18, marginTop: 10 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EFE5',
  },
  cardHeaderTitle: { color: '#183C35', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  cardDesc: { color: '#6A7D75', fontSize: 12, lineHeight: 18, marginBottom: 14 },

  codeContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  codeBox: {
    flex: 1,
    backgroundColor: '#F7FAF6',
    borderWidth: 2,
    borderColor: '#CBE0D1',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { color: '#176B52', fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  copyBtn: {
    backgroundColor: '#DDF3A3',
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  copyBtnText: { color: '#183C35', fontSize: 12, fontWeight: '800' },

  shareBtn: {
    backgroundColor: '#EAF4EE',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C7E2D1',
  },
  shareBtnText: { color: '#176B52', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  inputContainer: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2ECE4',
    color: '#183C35',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#176B52',
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  alreadyEnteredCard: {
    backgroundColor: '#EAF5EE',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#C1E0CC',
  },
  alreadyEnteredTitle: { color: '#176B52', fontSize: 13, fontWeight: '800' },
  alreadyEnteredDesc: { color: '#4F6C5E', fontSize: 11, marginTop: 2 },

  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EFE5',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E4ECE5' },
  statNumber: { color: '#183C35', fontSize: 20, fontWeight: '900', marginTop: 4 },
  statLabel: { color: '#768880', fontSize: 11, marginTop: 2 },

  stepRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginTop: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#176B52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepTitle: { color: '#183C35', fontSize: 13, fontWeight: '800' },
  stepDesc: { color: '#687B72', fontSize: 11, lineHeight: 17, marginTop: 2 },

  rewardsLink: {
    backgroundColor: '#E8F2EC',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rewardsLinkText: { color: '#176B52', fontSize: 13, fontWeight: '800' },
});
