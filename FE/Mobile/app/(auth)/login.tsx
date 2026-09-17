import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  const router = useRouter();
  const [ten_dang_nhap, setTenDangNhap] = useState('admin');
  const [mat_khau, setMatKhau] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await authService.login(ten_dang_nhap, mat_khau);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng nhập</Text>
        <TextInput placeholder="Tên đăng nhập" value={ten_dang_nhap} onChangeText={setTenDangNhap} style={styles.input} />
        <TextInput placeholder="Mật khẩu" secureTextEntry value={mat_khau} onChangeText={setMatKhau} style={styles.input} />
        <Button title={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} onPress={handleLogin} disabled={loading} />
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/register' as any)}>Chưa có tài khoản? Đăng ký</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8FB' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginBottom: 18 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E6EAF0', color: '#152238' },
  linkText: { marginTop: 18, textAlign: 'center', color: '#1d4ed8' },
});
