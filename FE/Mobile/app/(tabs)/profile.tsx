import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color="#E76F51" /><Text style={styles.muted}>Đang tải tài khoản...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>TÀI KHOẢN</Text>
        <Text style={styles.title}>Hồ sơ của bạn</Text>

        {user ? (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.ho_ten)}</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.ho_ten}</Text>
              <Text style={styles.meta}>{user.email}</Text>
              <Text style={styles.meta}>{user.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}><Text style={styles.muted}>Chưa có dữ liệu tài khoản</Text></View>
        )}

        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/orders' as any)}>
            <MaterialIcons name="receipt-long" size={22} color="#E76F51" />
            <Text style={styles.menuText}>Đơn hàng của tôi</Text>
            <MaterialIcons name="chevron-right" size={23} color="#94a3b8" />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/cart' as any)}>
            <MaterialIcons name="shopping-cart" size={22} color="#E76F51" />
            <Text style={styles.menuText}>Giỏ hàng</Text>
            <MaterialIcons name="chevron-right" size={23} color="#94a3b8" />
          </Pressable>
          <View style={styles.menuItem}>
            <MaterialIcons name="location-on" size={22} color="#E76F51" />
            <Text style={styles.menuText}>{user?.dia_chi || 'Chưa có địa chỉ giao hàng'}</Text>
          </View>
        </View>

        <Pressable style={styles.logout} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 20 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginTop: 5, marginBottom: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#64748b' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eef2f7' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#152238', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  name: { color: '#152238', fontSize: 18, fontWeight: '800' },
  meta: { color: '#64748b', fontSize: 13, marginTop: 4 },
  menu: { backgroundColor: '#fff', borderRadius: 14, marginTop: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#eef2f7' },
  menuItem: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuText: { color: '#152238', fontSize: 14, fontWeight: '700', flex: 1 },
  logout: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E76F51', borderRadius: 10, padding: 15 },
  logoutText: { color: '#fff', fontWeight: '800' },
});
