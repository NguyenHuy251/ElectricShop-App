import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthField, AuthShell } from '@/components/auth-ui';
import { authService } from '../../services/auth.service';
import { getApiMessage } from '../../utils/format';
import { validateRegistration, type RegistrationForm } from '../../utils/registration';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ ten_dang_nhap: '', mat_khau: '', ho_ten: '', email: '', so_dien_thoai: '', dia_chi: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const busy = useRef(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors(current => ({ ...current, [key]: undefined }));
    setError('');
  };
  const fieldError = (key: keyof RegistrationForm) => fieldErrors[key] ? <Text accessibilityRole="alert" style={styles.error}>{fieldErrors[key]}</Text> : null;

  const handleRegister = async () => {
    if (busy.current) return;
    const { value, errors } = validateRegistration(form);
    setForm(value);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Vui lòng kiểm tra các thông tin được đánh dấu bên dưới.');
      return;
    }

    busy.current = true;
    setError('');
    setLoading(true);
    try {
      await authService.register(value);
      router.replace({ pathname: '/(auth)/login', params: { registered: '1', username: value.ten_dang_nhap } });
    } catch (error: any) {
      const retryAfter = Number(error?.response?.headers?.['retry-after']);
      setError(getApiMessage(error, 'Đăng ký thất bại') + (error?.response?.status === 429 && retryAfter > 0 ? ` Thử lại sau khoảng ${Math.ceil(retryAfter / 60)} phút.` : ''));
      if (error?.response?.data?.fieldErrors) setFieldErrors(error.response.data.fieldErrors);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthShell register>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Thông tin này sẽ dùng khi đặt hàng</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <AuthField placeholder="Tên đăng nhập" value={form.ten_dang_nhap} onChangeText={(value) => setField('ten_dang_nhap', value)} autoCapitalize="none" />
        {fieldError('ten_dang_nhap')}
        <AuthField placeholder="Mật khẩu" secureTextEntry value={form.mat_khau} onChangeText={(value) => setField('mat_khau', value)} />
        <Text style={styles.hint}>Mật khẩu cần ít nhất 8 ký tự.</Text>
        {fieldError('mat_khau')}
        <AuthField placeholder="Họ tên" value={form.ho_ten} onChangeText={(value) => setField('ho_ten', value)} />
        {fieldError('ho_ten')}
        <AuthField placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => setField('email', value)} />
        {fieldError('email')}
        <AuthField placeholder="Số điện thoại" keyboardType="phone-pad" value={form.so_dien_thoai} onChangeText={(value) => setField('so_dien_thoai', value)} />
        {fieldError('so_dien_thoai')}
        <AuthField placeholder="Địa chỉ giao hàng" value={form.dia_chi} onChangeText={(value) => setField('dia_chi', value)} />
        {fieldError('dia_chi')}
        <Pressable accessibilityRole="button" style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.back()}>Quay lại đăng nhập</Text>
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
