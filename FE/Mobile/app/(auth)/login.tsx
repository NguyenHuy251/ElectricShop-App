import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { AuthField, AuthShell } from '@/components/auth-ui';
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
    <AuthShell>
        <Text style={styles.title}>Chào bạn trở lại!</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục chọn đồ cho tổ ấm.</Text>
        <AuthField placeholder="Tên đăng nhập" value={ten_dang_nhap} onChangeText={setTenDangNhap} autoCapitalize="none" />
        <AuthField placeholder="Mật khẩu" secureTextEntry value={mat_khau} onChangeText={setMatKhau} />
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/register' as any)}>Chưa có tài khoản? Đăng ký</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: { color: '#183C35', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#6D7D76', marginTop: 6, marginBottom: 24 },
  button: { height: 54, borderRadius: 16, backgroundColor: '#176B52', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkText: { paddingVertical: 16, marginTop: 6, textAlign: 'center', color: '#176B52', fontWeight: '700' },
});
