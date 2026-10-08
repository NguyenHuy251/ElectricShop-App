import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthField, AuthShell } from '@/components/auth-ui';
import { shop } from '@/constants/shop-theme';
import { authService } from '@/services/auth.service';
import { getApiMessage } from '@/utils/format';
import { validateForgotPassword } from '@/utils/forgot-password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; so_dien_thoai?: string }>({});
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const busy = useRef(false);
  const reset = async () => {
    if (busy.current || newPassword) return;
    const { value, errors } = validateForgotPassword(email, phone);
    setEmail(value.email); setPhone(value.so_dien_thoai); setFieldErrors(errors); setError('');
    if (Object.keys(errors).length) return;
    busy.current = true; setLoading(true);
    try {
      const response = await authService.forgotPassword(value);
      setNewPassword(response.data.new_password);
    } catch (err: any) {
      const retry = Number(err?.response?.headers?.['retry-after']);
      setError(getApiMessage(err, 'Không thể đặt lại mật khẩu.') + (err?.response?.status === 429 && retry > 0 ? ` Thử lại sau khoảng ${Math.ceil(retry / 60)} phút.` : ''));
    } finally { busy.current = false; setLoading(false); }
  };
  return <AuthShell register>
    <Text style={styles.title}>Quên mật khẩu</Text>
    {newPassword ? <View style={styles.success} accessibilityRole="alert">
      <Text style={styles.successTitle}>Đặt lại mật khẩu thành công</Text>
      <Text style={styles.description}>Mật khẩu mới của bạn là:</Text>
      <Text selectable style={styles.password}>{newPassword}</Text>
      <Text style={styles.description}>Hãy đăng nhập bằng mật khẩu mới. Bạn có thể đổi mật khẩu trong mục Tài khoản.</Text>
    </View> : <>
      <Text style={styles.subtitle}>Nhập email và số điện thoại đã đăng ký cùng một tài khoản để đặt lại mật khẩu.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <AuthField placeholder="Email đã đăng ký" value={email} onChangeText={value => { setEmail(value); setFieldErrors(current => ({ ...current, email: undefined })); setError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!loading} />
      {fieldErrors.email ? <Text accessibilityRole="alert" style={styles.error}>{fieldErrors.email}</Text> : null}
      <AuthField placeholder="Số điện thoại đã đăng ký" value={phone} onChangeText={value => { setPhone(value); setFieldErrors(current => ({ ...current, so_dien_thoai: undefined })); setError(''); }} keyboardType="phone-pad" autoComplete="tel" editable={!loading} />
      {fieldErrors.so_dien_thoai ? <Text accessibilityRole="alert" style={styles.error}>{fieldErrors.so_dien_thoai}</Text> : null}
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => void reset()} style={[styles.button, loading && styles.disabled]}><Text style={styles.buttonText}>{loading ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}</Text></Pressable>
    </>}
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.replace('/(auth)/login')} style={newPassword ? styles.button : styles.back}><Text style={newPassword ? styles.buttonText : styles.link}>{newPassword ? 'Đăng nhập ngay' : 'Quay lại đăng nhập'}</Text></Pressable>
  </AuthShell>;
}

const styles = StyleSheet.create({
  title: { fontSize: 27, fontWeight: '800', color: shop.ink, marginBottom: 10 },
  subtitle: { color: shop.muted, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  button: { backgroundColor: shop.primary, borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 }, back: { padding: 16, alignItems: 'center' }, link: { color: shop.primary, fontWeight: '700' },
  error: { color: '#B33434', fontSize: 13, marginBottom: 12, lineHeight: 20 },
  success: { backgroundColor: '#EAF5EE', borderWidth: 1, borderColor: shop.border, padding: 20, borderRadius: 18, marginVertical: 12 },
  successTitle: { color: shop.primary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { color: shop.ink, fontSize: 14, lineHeight: 22 },
  password: { color: shop.primary, fontSize: 30, fontWeight: '800', letterSpacing: 3, marginVertical: 16 },
});
