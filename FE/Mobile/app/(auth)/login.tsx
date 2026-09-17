import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth.service';
import { getApiMessage } from '../../utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const [ten_dang_nhap, setTenDangNhap] = useState('');
  const [mat_khau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ten_dang_nhap.trim() || !mat_khau) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      await authService.login(ten_dang_nhap.trim(), mat_khau);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi', getApiMessage(error, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logo}><MaterialIcons name="bolt" size={34} color="#fff" /></View>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Tiếp tục mua sắm đồ điện gia dụng</Text>
        <TextInput placeholder="Tên đăng nhập" placeholderTextColor="#94a3b8" value={ten_dang_nhap} onChangeText={setTenDangNhap} autoCapitalize="none" style={styles.input} />
        <TextInput placeholder="Mật khẩu" placeholderTextColor="#94a3b8" secureTextEntry value={mat_khau} onChangeText={setMatKhau} style={styles.input} />
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/register' as any)}>Chưa có tài khoản? Đăng ký</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 24 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', color: '#152238' },
  button: { height: 50, borderRadius: 11, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkText: { marginTop: 18, textAlign: 'center', color: '#E76F51', fontWeight: '700' },
});
