import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Thông tin này sẽ dùng khi đặt hàng</Text>
        <TextInput placeholder="Tên đăng nhập" placeholderTextColor="#94a3b8" value={form.ten_dang_nhap} onChangeText={(value) => setField('ten_dang_nhap', value)} autoCapitalize="none" style={styles.input} />
        <TextInput placeholder="Mật khẩu" placeholderTextColor="#94a3b8" secureTextEntry value={form.mat_khau} onChangeText={(value) => setField('mat_khau', value)} style={styles.input} />
        <TextInput placeholder="Họ tên" placeholderTextColor="#94a3b8" value={form.ho_ten} onChangeText={(value) => setField('ho_ten', value)} style={styles.input} />
        <TextInput placeholder="Email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => setField('email', value)} style={styles.input} />
        <TextInput placeholder="Số điện thoại" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={form.so_dien_thoai} onChangeText={(value) => setField('so_dien_thoai', value)} style={styles.input} />
        <TextInput placeholder="Địa chỉ giao hàng" placeholderTextColor="#94a3b8" value={form.dia_chi} onChangeText={(value) => setField('dia_chi', value)} style={styles.input} />
        <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
        </Pressable>
        <Text style={styles.linkText} onPress={() => router.back()}>Quay lại đăng nhập</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 24 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', color: '#152238' },
  button: { height: 50, borderRadius: 11, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkText: { marginTop: 18, textAlign: 'center', color: '#E76F51', fontWeight: '700' },
});
