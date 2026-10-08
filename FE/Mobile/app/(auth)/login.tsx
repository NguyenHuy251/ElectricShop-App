import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthField, AuthShell } from '@/components/auth-ui';
import { authService } from '../../services/auth.service';
import { getApiMessage } from '../../utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const [ten_dang_nhap, setTenDangNhap] = useState('');
  const [mat_khau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const handleLogin = async () => {
    if (busy.current) return;
    if (!ten_dang_nhap.trim() || !mat_khau) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    busy.current = true;
    setError('');
    setLoading(true);
    try {
      await authService.login(ten_dang_nhap.trim(), mat_khau);
      router.replace('/(tabs)');
    } catch (error: any) {
      const retryAfter = Number(error?.response?.headers?.['retry-after']);
      setError(getApiMessage(error, 'Đăng nhập thất bại') + (error?.response?.status === 429 && retryAfter > 0 ? ` Thử lại sau khoảng ${Math.ceil(retryAfter / 60)} phút.` : ''));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthShell>
        <Text style={styles.title}>Chào bạn trở lại!</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục chọn đồ cho tổ ấm.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <AuthField placeholder="Tên đăng nhập" value={ten_dang_nhap} onChangeText={value => { setTenDangNhap(value); setError(''); }} autoCapitalize="none" autoCorrect={false} editable={!loading} />
        <Text style={styles.hint}>Dùng tên đăng nhập bạn đã tạo khi đăng ký.</Text>
        <AuthField placeholder="Mật khẩu" secureTextEntry value={mat_khau} onChangeText={value => { setMatKhau(value); setError(''); }} editable={!loading} />
        <Pressable accessibilityRole="button" style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.push('/(auth)/register' as any)}>Chưa có tài khoản? Đăng ký</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { color: '#A52D2D', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  hint: { color: '#6D7D76', fontSize: 12, marginBottom: 12 },
  title: { color: '#183C35', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#6D7D76', marginTop: 6, marginBottom: 24 },
  button: { height: 54, borderRadius: 16, backgroundColor: '#176B52', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkText: { paddingVertical: 16, marginTop: 6, textAlign: 'center', color: '#176B52', fontWeight: '700' },
});
