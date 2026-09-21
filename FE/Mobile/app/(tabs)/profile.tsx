import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState, ScreenHeading } from '@/components/shop-ui';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';
import { getInitials } from '../../utils/format';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadProfile();
  }, [loadProfile]));

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/login' as any);
    Alert.alert('Thông báo', 'Đã đăng xuất');
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải tài khoản..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeading eyebrow="GÓC RIÊNG CỦA BẠN" title="Xin chào, bạn!" subtitle="Mọi thông tin mua sắm, trong tầm tay." icon="person-outline" />

        {user ? (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.ho_ten)}</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.memberLabel}>THÀNH VIÊN ELECTRIC SHOP</Text>
              <Text style={styles.name}>{user.ho_ten}</Text>
              <Text style={styles.meta}>{user.email}</Text>
              <Text style={styles.meta}>{user.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}><Text style={styles.muted}>Chưa có dữ liệu tài khoản</Text></View>
        )}

<Text style={styles.menuLabel}>MUA SẮM & GIAO NHẬN</Text>
        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/orders' as any)}>
            <MaterialIcons name="receipt-long" size={22} color="#176B52" />
            <Text style={styles.menuText}>Đơn hàng của tôi</Text>
            <MaterialIcons name="chevron-right" size={23} color="#84938B" />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/cart' as any)}>
            <MaterialIcons name="shopping-cart" size={22} color="#176B52" />
            <Text style={styles.menuText}>Giỏ hàng</Text>
            <MaterialIcons name="chevron-right" size={23} color="#84938B" />
          </Pressable>
          <View style={styles.menuItem}>
            <MaterialIcons name="location-on" size={22} color="#176B52" />
            <Text style={styles.menuText}>{user?.dia_chi || 'Chưa có địa chỉ giao hàng'}</Text>
          </View>
        </View>

<View style={styles.profileNote}><MaterialIcons name="spa" size={28} color="#176B52" /><Text style={styles.profileNoteText}>Cảm ơn bạn đã để Electric Shop đồng hành cùng tổ ấm.</Text></View>
        <Pressable style={styles.logout} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#BC4545" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  memberLabel: { color: '#DDF3A3', fontSize: 8, letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  menuLabel: { color: '#6D7D76', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 30 },
  profileNote: { backgroundColor: '#E7F1E9', borderRadius: 22, padding: 20, flexDirection: 'row', gap: 12, alignItems: 'center', marginVertical: 24 },
  profileNoteText: { flex: 1, color: '#596C62', fontSize: 13, lineHeight: 21 },
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  container: { flexGrow: 1, padding: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
  muted: { color: '#6D7D76' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#183C35', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#EAF0E7' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#35604B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  meta: { color: '#CFDBD0', fontSize: 13, marginTop: 4 },
  menu: { backgroundColor: '#fff', borderRadius: 22, marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EAF0E7' },
  menuItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EDF2E9' },
  menuText: { color: '#183C35', fontSize: 14, fontWeight: '700', flex: 1 },
  logout: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 16, padding: 17 },
  logoutText: { color: '#BC4545', fontWeight: '800' },
});
