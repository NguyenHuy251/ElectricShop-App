import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.container}>
        <Text style={styles.title}>Tài khoản</Text>
        {user ? (
          <View style={styles.card}>
            <Text style={styles.name}>{user.ho_ten}</Text>
            <Text>{user.email}</Text>
            <Text>{user.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
          </View>
        ) : <Text>Chưa có dữ liệu</Text>}
        <Button title="Đăng xuất" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  name: { fontWeight: '800', fontSize: 18 },
});
