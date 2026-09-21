import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { AuthField, AuthShell } from '@/components/auth-ui';
import { authService } from '../../services/auth.service';
import { getApiMessage } from '../../utils/format';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ ten_dang_nhap: '', mat_khau: '', ho_ten: '', email: '', so_dien_thoai: '', dia_chi: '' });
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleRegister = async () => {
    if (!form.ten_dang_nhap || !form.mat_khau || !form.ho_ten || !form.email) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đăng nhập, mật khẩu, họ tên và email');
      return;
    }

    setLoading(true);
    try {
      await authService.register(form);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi', getApiMessage(error, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell register>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Thông tin này sẽ dùng khi đặt hàng</Text>
        <AuthField placeholder="Tên đăng nhập" value={form.ten_dang_nhap} onChangeText={(value) => setField('ten_dang_nhap', value)} autoCapitalize="none" />
        <AuthField placeholder="Mật khẩu" secureTextEntry value={form.mat_khau} onChangeText={(value) => setField('mat_khau', value)} />
        <AuthField placeholder="Họ tên" value={form.ho_ten} onChangeText={(value) => setField('ho_ten', value)} />
        <AuthField placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => setField('email', value)} />
        <AuthField placeholder="Số điện thoại" keyboardType="phone-pad" value={form.so_dien_thoai} onChangeText={(value) => setField('so_dien_thoai', value)} />
        <AuthField placeholder="Địa chỉ giao hàng" value={form.dia_chi} onChangeText={(value) => setField('dia_chi', value)} />
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.back()}>Quay lại đăng nhập</Text>
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
