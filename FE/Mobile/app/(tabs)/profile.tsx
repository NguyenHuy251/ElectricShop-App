import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const userString = await AsyncStorage.getItem('user');
      if (userString) setUser(JSON.parse(userString));
    };
    load();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login' as any);
    Alert.alert('Thông báo', 'Đã đăng xuất');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>KHÔNG GIAN CÁ NHÂN</Text>
        <Text style={styles.title}>Tài khoản của bạn</Text>
        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(user.ho_ten || 'A').charAt(0).toUpperCase()}</Text></View>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{user.ho_ten || 'Khách hàng'}</Text>
              <Text style={styles.email}>{user.email || 'Chưa có email'}</Text>
              <Text style={styles.phone}>{user.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
            </View>
            <MaterialIcons name="edit" size={20} color="#E76F51" />
          </View>
        ) : <View style={styles.card}><Text style={styles.empty}>Chưa có dữ liệu tài khoản</Text></View>}
        <Text style={styles.section}>TRUY CẬP NHANH</Text>
        {[
          ['Đơn hàng của tôi', 'receipt-long'],
          ['Sản phẩm đã lưu', 'favorite-border'],
          ['Địa chỉ giao hàng', 'location-on'],
          ['Trung tâm trợ giúp', 'help-outline'],
        ].map(([label, icon]) => (
          <View style={styles.menuItem} key={label}>
            <View style={styles.menuIcon}><MaterialIcons name={icon as any} size={21} color="#E76F51" /></View>
            <Text style={styles.menuText}>{label}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#A5AFBB" />
          </View>
        ))}
        <View style={styles.member}><MaterialIcons name="verified" size={25} color="#F2B134" /><View style={styles.memberCopy}><Text style={styles.memberTitle}>Thành viên Home+</Text><Text style={styles.memberText}>Tận hưởng ưu đãi sớm và giá dành riêng cho thành viên.</Text></View></View>
        <Button title="Đăng xuất" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8FB' },
  container: { padding: 20, paddingBottom: 32 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginTop: 5, marginBottom: 22 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 17, borderRadius: 14, marginBottom: 28, shadowColor: '#152238', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#152238', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#A8DADC', fontSize: 21, fontWeight: '800' },
  userInfo: { flex: 1, marginLeft: 13 },
  name: { color: '#152238', fontSize: 16, fontWeight: '800' },
  email: { color: '#8490A0', fontSize: 12, marginTop: 4 },
  phone: { color: '#8490A0', fontSize: 12, marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  empty: { color: '#64748b' },
  section: { color: '#8A96A5', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  menuIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF1EC', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  menuText: { color: '#152238', fontSize: 14, fontWeight: '700', flex: 1 },
  member: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF8E5', padding: 16, borderRadius: 14, marginTop: 25, marginBottom: 20 },
  memberCopy: { flex: 1 },
  memberTitle: { color: '#8B6712', fontWeight: '800', fontSize: 13 },
  memberText: { color: '#A68D4A', fontSize: 12, marginTop: 4 },
});
