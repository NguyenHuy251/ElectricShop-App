import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState } from '../components/shop-ui';
import {
  rewardsService,
  type RewardsStatus,
} from '../services/rewards.service';
import { formatCurrency, getApiMessage } from '../utils/format';

export default function RewardsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<RewardsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [claimingMoc, setClaimingMoc] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [exchangingCode, setExchangingCode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await rewardsService.getStatus();
      setStatus(data);
    } catch (err) {
      Alert.alert('Thông báo', getApiMessage(err, 'Chưa tải được dữ liệu điểm thưởng.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleCheckin = async () => {
    if (status?.da_diem_danh_hom_nay) {
      Alert.alert('Đã điểm danh', 'Hôm nay bạn đã điểm danh rồi. Hãy quay lại vào ngày mai nhé!');
      return;
    }
    setSubmittingCheckin(true);
    try {
      const res = await rewardsService.checkin();
      Alert.alert(
        '🎉 Điểm danh thành công!',
        `Bạn nhận được +${res.diem_cong} Xu!\nChuỗi ngày liên tục: ${res.chuoi_ngay} ngày.\n${res.qua_tang !== 'Điểm danh hàng ngày' ? `🎁 Quà mốc: ${res.qua_tang}` : ''}`,
        [
          { text: 'Xem Ví Voucher', onPress: () => router.push('/vouchers') },
          { text: 'Tuyệt vời', style: 'cancel' },
        ]
      );
      void loadData();
    } catch (err) {
      Alert.alert('Lỗi', getApiMessage(err, 'Chưa thể điểm danh lúc này.'));
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const handleClaimMilestone = async (moc: number) => {
    const isClaimed = (status?.mocs_da_nhan || []).includes(moc);
    if (isClaimed) {
      Alert.alert('Đã nhận', `Bạn đã nhận quà mốc ${moc} ngày rồi.`);
      return;
    }
    if ((status?.chuoi_ngay || 0) < moc) {
      Alert.alert('Chưa đạt mốc', `Bạn cần chuỗi điểm danh tối thiểu ${moc} ngày để nhận phần quà này. Hãy kiên trì điểm danh thêm nhé!`);
      return;
    }

    setClaimingMoc(moc);
    try {
      const res = await rewardsService.claimMilestone(moc);
      Alert.alert(
        '🎉 Nhận quà mốc thành công!',
        `Chúc mừng bạn đã nhận phần quà mốc ${moc} ngày:\n${res.phan_thuong}\nSố Xu tích lũy hiện tại: ${res.tong_diem_hien_tai.toLocaleString('vi-VN')} Xu.`,
        [
          { text: 'Xem Ví Voucher', onPress: () => router.push('/vouchers') },
          { text: 'Tuyệt vời', style: 'cancel' },
        ]
      );
      void loadData();
    } catch (err) {
      Alert.alert('Chưa thể nhận quà', getApiMessage(err, 'Chưa đủ điều kiện nhận mốc này.'));
    } finally {
      setClaimingMoc(null);
    }
  };

  const handleSpin = async () => {
    if ((status?.diem_thuong || 0) < 100) {
      Alert.alert('Không đủ xu', 'Bạn cần tối thiểu 100 Xu để quay vòng quay may mắn.');
      return;
    }
    setSpinning(true);
    try {
      const res = await rewardsService.spinWheel();
      Alert.alert('🎡 Chúc mừng bạn!', res.prize, [
        {
          text: 'Xem Voucher',
          onPress: () => router.push('/vouchers'),
        },
        { text: 'Đóng', style: 'cancel' },
      ]);
      void loadData();
    } catch (err) {
      Alert.alert('Lỗi', getApiMessage(err, 'Chưa thể quay vòng quay lúc này.'));
    } finally {
      setSpinning(false);
    }
  };

  const handleExchange = async (rewardCode: string, title: string, cost: number) => {
    if ((status?.diem_thuong || 0) < cost) {
      Alert.alert('Chưa đủ xu', `Bạn cần ${cost} Xu để đổi ${title}. Hãy điểm danh thêm nhé!`);
      return;
    }

    Alert.alert('Xác nhận đổi thưởng', `Bạn có chắc muốn dùng ${cost} Xu để đổi ${title}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đổi ngay',
        onPress: async () => {
          setExchangingCode(rewardCode);
          try {
            const res = await rewardsService.exchangeVoucher(rewardCode);
            Alert.alert(
              '🎉 Đổi thưởng thành công!',
              `Mã giảm giá "${res.ma_code}" đã được kích hoạt trong ví của bạn. Bạn có thể sử dụng ngay khi thanh toán đơn hàng!`,
              [
                { text: 'Xem kho Voucher', onPress: () => router.push('/vouchers') },
                { text: 'Tiếp tục', style: 'cancel' },
              ]
            );
            void loadData();
          } catch (err) {
            Alert.alert('Lỗi', getApiMessage(err, 'Chưa thể đổi voucher lúc này.'));
          } finally {
            setExchangingCode(null);
          }
        },
      },
    ]);
  };

  if (loading && !status) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Đang nạp kho quà và xu thưởng..." />
      </SafeAreaView>
    );
  }

  const streak = status?.chuoi_ngay || 0;
  const currentPoints = status?.diem_thuong || 0;
  const claimedMilestones = status?.mocs_da_nhan || [];

  // Full 30 days check-in model
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    let points = 100;
    let bonusTag: string | null = null;
    let icon = 'star';

    if (dayNum === 3) {
      points = 200;
      bonusTag = '+200X';
    } else if (dayNum === 7) {
      points = 300;
      bonusTag = 'Voucher 30K';
      icon = 'card-giftcard';
    } else if (dayNum === 14) {
      points = 500;
      bonusTag = 'Voucher 50K';
      icon = 'card-giftcard';
    } else if (dayNum === 21) {
      points = 700;
      bonusTag = 'Voucher 70K';
      icon = 'redeem';
    } else if (dayNum === 30) {
      points = 1000;
      bonusTag = 'Siêu Quà 100K';
      icon = 'emoji-events';
    }

    return { day: dayNum, points, bonusTag, icon };
  });

  // Milestone list with action buttons
  const milestones = [
    {
      moc: 3,
      title: 'Mốc 3 ngày',
      reward: 'Thưởng +100 Xu',
      voucherCode: null,
      icon: 'star',
      bg: '#EAF8F0',
      iconColor: '#176B52',
    },
    {
      moc: 7,
      title: 'Mốc 7 ngày',
      reward: 'Voucher 30K + 300 Xu',
      voucherCode: 'CHECKIN7D',
      icon: 'card-giftcard',
      bg: '#FFF2E8',
      iconColor: '#D97706',
    },
    {
      moc: 14,
      title: 'Mốc 14 ngày',
      reward: 'Voucher 50K + 500 Xu',
      voucherCode: 'CHECKIN14D',
      icon: 'card-giftcard',
      bg: '#F2EEFF',
      iconColor: '#7C3AED',
    },
    {
      moc: 21,
      title: 'Mốc 21 ngày',
      reward: 'Voucher 70K + 700 Xu',
      voucherCode: 'CHECKIN21D',
      icon: 'redeem',
      bg: '#EAF5FF',
      iconColor: '#0284C7',
    },
    {
      moc: 30,
      title: 'Mốc 30 ngày',
      reward: 'Siêu Voucher 100K + 1000 Xu',
      voucherCode: 'CHECKIN30D',
      icon: 'emoji-events',
      bg: '#FEF3C7',
      iconColor: '#B45309',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadData(); }} />}
      >
        {/* Top Wallet Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>KHO XU & TÍCH ĐIỂM THƯỞNG</Text>
              <View style={styles.coinRow}>
                <MaterialCommunityIcons name="bitcoin" size={32} color="#DDF3A3" />
                <Text style={styles.coinAmount}>{currentPoints.toLocaleString('vi-VN')}</Text>
                <Text style={styles.coinUnit}>Xu</Text>
              </View>
            </View>
            <Pressable style={styles.inviteBadge} onPress={() => router.push('/referral' as any)}>
              <MaterialIcons name="group-add" size={18} color="#183C35" />
              <Text style={styles.inviteBadgeText}>Mời bạn +500 Xu</Text>
            </Pressable>
          </View>
          <Text style={styles.heroSubtitle}>Điểm danh mỗi ngày và mời bạn bè để nhận hàng ngàn voucher giảm giá mua sắm.</Text>
        </View>

        {/* Daily Check-in Card (30-day journey) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <MaterialIcons name="event-available" size={24} color="#176B52" />
              <Text style={styles.cardTitle}>Hành trình Điểm danh 30 ngày</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 Chuỗi {streak} ngày</Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>
            Duy trì chuỗi điểm danh 30 ngày liên tục trong tháng để mở khóa toàn bộ các rương quà và siêu voucher giá trị lớn.
          </Text>

          {/* Legend indicator */}
          <View style={styles.gridLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#176B52' }]} />
              <Text style={styles.legendText}>Đã điểm danh</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706', borderColor: '#FDE68A', borderWidth: 1 }]} />
              <Text style={styles.legendText}>Mốc quà lớn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
              <Text style={styles.legendText}>Chưa tới</Text>
            </View>
          </View>

          {/* Full 30-Day Check-in Calendar Grid (6 columns x 5 rows) */}
          <View style={styles.monthGrid}>
            {days30.map((item) => {
              const isChecked = streak >= item.day;
              const isToday = streak % 30 === item.day - 1 && !status?.da_diem_danh_hom_nay;
              const isBigMilestone = [3, 7, 14, 21, 30].includes(item.day);

              return (
                <View
                  key={item.day}
                  style={[
                    styles.gridCell,
                    isChecked && styles.gridCellChecked,
                    isToday && styles.gridCellToday,
                    isBigMilestone && !isChecked && styles.gridCellMilestone,
                  ]}
                >
                  <Text style={[styles.gridCellDay, isChecked && styles.gridCellDayChecked]}>
                    N{item.day}
                  </Text>
                  <MaterialIcons
                    name={(isChecked ? 'check-circle' : item.icon) as any}
                    size={16}
                    color={isChecked ? '#fff' : isBigMilestone ? '#D97706' : '#176B52'}
                  />
                  <Text style={[styles.gridCellPoints, isChecked && styles.gridCellPointsChecked]}>
                    +{item.points >= 1000 ? '1K' : item.points}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Checkin Action Button */}
          <Pressable
            style={[styles.checkinButton, status?.da_diem_danh_hom_nay && styles.checkinButtonDone]}
            onPress={handleCheckin}
            disabled={status?.da_diem_danh_hom_nay || submittingCheckin}
          >
            <MaterialIcons
              name={status?.da_diem_danh_hom_nay ? 'check' : 'touch-app'}
              size={22}
              color={status?.da_diem_danh_hom_nay ? '#556A60' : '#183C35'}
            />
            <Text style={[styles.checkinButtonText, status?.da_diem_danh_hom_nay && styles.checkinButtonTextDone]}>
              {status?.da_diem_danh_hom_nay
                ? 'Đã điểm danh hôm nay ✓'
                : submittingCheckin
                ? 'Đang xử lý...'
                : 'ĐIỂM DANH NGAY (+100 XU)'}
            </Text>
          </Pressable>

          {/* Streaks Milestone Gifts (Clickable & Claimable!) */}
          <View style={styles.milestonesContainer}>
            <View style={styles.milestoneHeaderRow}>
              <Text style={styles.milestoneTitle}>MỐC QUÀ TẶNG CHUỖI LIÊN TỤC (ẤN ĐỂ NHẬN QUÀ)</Text>
              <Text style={styles.milestoneSubtitle}>Chuỗi hiện tại: {streak} ngày</Text>
            </View>

            <View style={styles.milestonesList}>
              {milestones.map((item) => {
                const isClaimed = claimedMilestones.includes(item.moc);
                const canClaim = streak >= item.moc && !isClaimed;
                const isClaiming = claimingMoc === item.moc;
                const progressPct = Math.min(100, Math.round((streak / item.moc) * 100));

                return (
                  <Pressable
                    key={item.moc}
                    style={[
                      styles.milestoneCard,
                      canClaim && styles.milestoneCardCanClaim,
                      isClaimed && styles.milestoneCardClaimed,
                    ]}
                    onPress={() => handleClaimMilestone(item.moc)}
                    disabled={isClaimed || isClaiming}
                  >
                    <View style={[styles.milestoneIconWrap, { backgroundColor: item.bg }]}>
                      <MaterialIcons name={item.icon as any} size={24} color={item.iconColor} />
                    </View>

                    <View style={styles.milestoneInfo}>
                      <View style={styles.milestoneNameRow}>
                        <Text style={styles.milestoneNameText}>{item.title}</Text>
                        {item.voucherCode ? (
                          <View style={styles.codePill}>
                            <Text style={styles.codePillText}>{item.voucherCode}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.milestoneRewardText}>{item.reward}</Text>

                      {/* Progress bar */}
                      {!isClaimed && (
                        <View style={styles.progressBarWrap}>
                          <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                          </View>
                          <Text style={styles.progressLabel}>
                            {canClaim ? 'Đã đạt đủ ngày!' : `${streak}/${item.moc} ngày (${progressPct}%)`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Action button */}
                    <View style={styles.milestoneActionWrap}>
                      {isClaimed ? (
                        <View style={styles.btnClaimed}>
                          <MaterialIcons name="check-circle" size={16} color="#176B52" />
                          <Text style={styles.btnClaimedText}>Đã nhận</Text>
                        </View>
                      ) : canClaim ? (
                        <Pressable
                          style={[styles.btnClaimNow, isClaiming && styles.btnDisabled]}
                          onPress={() => handleClaimMilestone(item.moc)}
                          disabled={isClaiming}
                        >
                          <MaterialIcons name="redeem" size={16} color="#183C35" />
                          <Text style={styles.btnClaimNowText}>
                            {isClaiming ? 'Đang nhận...' : 'Nhận quà'}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={styles.btnLocked}>
                          <MaterialIcons name="lock" size={14} color="#84938B" />
                          <Text style={styles.btnLockedText}>Chưa đạt</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Lucky Spin Wheel Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="ferris-wheel" size={24} color="#176B52" />
              <Text style={styles.cardTitle}>Vòng quay may mắn</Text>
            </View>
            <Tag color="#176B52" text="100 Xu / lượt" />
          </View>
          <Text style={styles.cardDesc}>Thử vận may mỗi ngày để rinh về Jackpot 500 Xu hoặc Siêu Voucher 50K mua sắm.</Text>

          <View style={styles.spinPreview}>
            <MaterialCommunityIcons name="star-circle" size={48} color="#FFB800" />
            <View style={{ flex: 1 }}>
              <Text style={styles.spinPrizeTitle}>Cơ cấu giải thưởng:</Text>
              <Text style={styles.spinPrizeList}>• Jackpot +500 Xu • Voucher 50K • Freeship 15K • Voucher 20K</Text>
            </View>
          </View>

          <Pressable
            style={[styles.spinButton, (spinning || currentPoints < 100) && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={spinning || currentPoints < 100}
          >
            <MaterialCommunityIcons name="play-circle" size={24} color="#183C35" />
            <Text style={styles.spinButtonText}>
              {spinning ? 'Đang quay thưởng...' : currentPoints < 100 ? 'Cần tối thiểu 100 Xu' : 'QUAY THƯỞNG NGAY (100 XU)'}
            </Text>
          </Pressable>
        </View>

        {/* Exchange Vouchers Store */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <MaterialIcons name="local-offer" size={24} color="#176B52" />
              <Text style={styles.cardTitle}>Đổi Xu lấy Voucher mua sắm</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>Quy đổi điểm tích lũy thành mã giảm giá áp dụng trực tiếp khi đặt hàng.</Text>

          <View style={styles.voucherList}>
            {(status?.vouchers_doi_thuong || []).map((v) => {
              const canExchange = currentPoints >= v.xu_can;
              const isExchanging = exchangingCode === v.code;

              return (
                <View key={v.code} style={styles.voucherItem}>
                  <View style={styles.voucherLeft}>
                    <View style={styles.voucherIconBox}>
                      <MaterialIcons name="confirmation-number" size={24} color="#176B52" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voucherItemTitle}>{v.title}</Text>
                      <Text style={styles.voucherItemMeta}>Đơn tối thiểu {formatCurrency(v.don_toi_thieu)}</Text>
                      <View style={styles.costBadge}>
                        <MaterialCommunityIcons name="bitcoin" size={14} color="#176B52" />
                        <Text style={styles.costText}>{v.xu_can} Xu</Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.exchangeButton, !canExchange && styles.exchangeButtonDisabled]}
                    onPress={() => handleExchange(v.code, v.title, v.xu_can)}
                    disabled={!canExchange || isExchanging}
                  >
                    <Text style={[styles.exchangeButtonText, !canExchange && styles.exchangeButtonTextDisabled]}>
                      {isExchanging ? 'Đang đổi...' : canExchange ? 'Đổi ngay' : 'Thiếu xu'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Invite Friends Promotion Banner */}
        <Pressable style={styles.inviteBanner} onPress={() => router.push('/referral' as any)}>
          <View style={styles.inviteIcon}>
            <MaterialIcons name="share" size={26} color="#176B52" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>Mời bạn bè, nhận ngay 50.000đ</Text>
            <Text style={styles.inviteText}>Tặng mã quà tặng cho bạn bè và nhận +500 Xu khi họ tham gia.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#176B52" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tag({ color, text }: { color: string; text: string }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
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
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  heroEyebrow: { color: '#DDF3A3', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  coinAmount: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  coinUnit: { color: '#DDF3A3', fontSize: 16, fontWeight: '700', marginTop: 8 },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DDF3A3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  inviteBadgeText: { color: '#183C35', fontSize: 12, fontWeight: '800' },
  heroSubtitle: { color: '#C9D8CE', fontSize: 12, lineHeight: 18, marginTop: 12 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EFE5',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#183C35', fontSize: 16, fontWeight: '800' },
  streakBadge: { backgroundColor: '#FFF5E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  streakText: { color: '#B36B00', fontSize: 12, fontWeight: '800' },
  cardDesc: { color: '#6A7D75', fontSize: 12, lineHeight: 18, marginBottom: 14 },

  gridLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
    marginBottom: 14,
    backgroundColor: '#F5FAF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6A7D75',
    fontWeight: '700',
  },

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '15.2%',
    minHeight: 54,
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 1,
  },
  gridCellChecked: {
    backgroundColor: '#176B52',
    borderColor: '#176B52',
  },
  gridCellToday: {
    borderColor: '#D97706',
    borderWidth: 2,
    backgroundColor: '#FFFDF5',
  },
  gridCellMilestone: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  gridCellDay: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6A7D75',
    marginBottom: 1,
  },
  gridCellDayChecked: {
    color: '#fff',
  },
  gridCellPoints: {
    fontSize: 8,
    fontWeight: '700',
    color: '#183C35',
    marginTop: 1,
  },
  gridCellPointsChecked: {
    color: '#DDF3A3',
  },

  checkinButton: {
    backgroundColor: '#DDF3A3',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkinButtonDone: { backgroundColor: '#EDF2EB' },
  checkinButtonText: { color: '#183C35', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  checkinButtonTextDone: { color: '#6A7D75' },

  milestonesContainer: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#EDF3EC' },
  milestoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: { color: '#6A7D75', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  milestoneSubtitle: { color: '#176B52', fontSize: 11, fontWeight: '700' },

  milestonesList: { gap: 10 },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCF9',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EFE5',
    gap: 12,
  },
  milestoneCardCanClaim: {
    borderColor: '#176B52',
    backgroundColor: '#F5FAF6',
    shadowColor: '#176B52',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  milestoneCardClaimed: {
    backgroundColor: '#F4F7F3',
    opacity: 0.85,
  },
  milestoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: { flex: 1, gap: 3 },
  milestoneNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestoneNameText: { color: '#183C35', fontSize: 13, fontWeight: '800' },
  codePill: {
    backgroundColor: '#EAF0E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codePillText: { color: '#556A60', fontSize: 9, fontWeight: '700' },
  milestoneRewardText: { color: '#176B52', fontSize: 12, fontWeight: '700' },

  progressBarWrap: { marginTop: 4, gap: 2 },
  progressTrack: {
    height: 5,
    backgroundColor: '#E3EBE1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#176B52',
    borderRadius: 3,
  },
  progressLabel: { fontSize: 9, color: '#74877F', fontWeight: '600' },

  milestoneActionWrap: {
    alignItems: 'flex-end',
  },
  btnClaimNow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DDF3A3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6E87A',
  },
  btnClaimNowText: {
    color: '#183C35',
    fontSize: 12,
    fontWeight: '800',
  },
  btnClaimed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnClaimedText: {
    color: '#176B52',
    fontSize: 11,
    fontWeight: '700',
  },
  btnLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF2EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnLockedText: {
    color: '#84938B',
    fontSize: 11,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  spinPreview: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEE8A2',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  spinPrizeTitle: { color: '#8A5C00', fontSize: 13, fontWeight: '800' },
  spinPrizeList: { color: '#997300', fontSize: 11, marginTop: 4, lineHeight: 16 },
  spinButton: {
    backgroundColor: '#DDF3A3',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinButtonDisabled: { backgroundColor: '#EDF2EB' },
  spinButtonText: { color: '#183C35', fontSize: 13, fontWeight: '800' },

  voucherList: { gap: 10, marginTop: 6 },
  voucherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF7',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EFE5',
    gap: 12,
  },
  voucherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  voucherIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherItemTitle: { color: '#183C35', fontSize: 13, fontWeight: '800' },
  voucherItemMeta: { color: '#74877F', fontSize: 11, marginTop: 2 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  costText: { color: '#176B52', fontSize: 11, fontWeight: '800' },
  exchangeButton: {
    backgroundColor: '#176B52',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  exchangeButtonDisabled: { backgroundColor: '#D8E2D7' },
  exchangeButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  exchangeButtonTextDisabled: { color: '#84938B' },

  inviteBanner: {
    backgroundColor: '#183C35',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#2C5140',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  inviteText: { color: '#C9D8CE', fontSize: 11, marginTop: 3 },
  tag: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '700' },
});
