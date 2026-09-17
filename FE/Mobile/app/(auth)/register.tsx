import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth.service';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ ten_dang_nhap: '', mat_khau: '', ho_ten: '', email: '', so_dien_thoai: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await authService.register(form);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Đăng ký</Text>
        <TextInput placeholder="Tên đăng nhập" value={form.ten_dang_nhap} onChangeText={(value) => setForm({ ...form, ten_dang_nhap: value })} style={styles.input} />
        <TextInput placeholder="Mật khẩu" secureTextEntry value={form.mat_khau} onChangeText={(value) => setForm({ ...form, mat_khau: value })} style={styles.input} />
        <TextInput placeholder="Họ tên" value={form.ho_ten} onChangeText={(value) => setForm({ ...form, ho_ten: value })} style={styles.input} />
        <TextInput placeholder="Email" keyboardType="email-address" value={form.email} onChangeText={(value) => setForm({ ...form, email: value })} style={styles.input} />
        <TextInput placeholder="Số điện thoại" value={form.so_dien_thoai} onChangeText={(value) => setForm({ ...form, so_dien_thoai: value })} style={styles.input} />
        <Button title={loading ? 'Đang đăng ký...' : 'Đăng ký'} onPress={handleRegister} disabled={loading} />
        <Text style={styles.linkText} onPress={() => router.back()}>Quay lại đăng nhập</Text>
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
