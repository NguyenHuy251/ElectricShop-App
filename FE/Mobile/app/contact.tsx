import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeading } from '../components/shop-ui';
import { authService } from '../services/auth.service';
import { contactService } from '../services/contact.service';
import { getApiMessage } from '../utils/format';

type Form = { ho_ten: string; email: string; so_dien_thoai: string; tieu_de: string; noi_dung: string };
const emptyForm: Form = { ho_ten: '', email: '', so_dien_thoai: '', tieu_de: '', noi_dung: '' };

export default function ContactScreen() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(emptyForm);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void authService.getMe().then(({ data }) => setForm(current => ({
      ...current,
      ho_ten: current.ho_ten || data.ho_ten || '',
      email: current.email || data.email || '',
      so_dien_thoai: current.so_dien_thoai || data.so_dien_thoai || '',
    }))).catch(() => undefined);
  }, []);

  const setField = (key: keyof Form, value: string) => setForm(current => ({ ...current, [key]: value }));

  const submit = async () => {
    const payload = {
      ...form,
      ho_ten: form.ho_ten.trim(),
      email: form.email.trim(),
      so_dien_thoai: form.so_dien_thoai.trim(),
      tieu_de: form.tieu_de.trim(),
      noi_dung: form.noi_dung.trim(),
    };
    if (payload.ho_ten.length < 2 || payload.ho_ten.length > 100) return Alert.alert('Kiểm tra thông tin', 'Họ tên phải từ 2 đến 100 ký tự.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return Alert.alert('Kiểm tra thông tin', 'Vui lòng nhập email hợp lệ.');
    if (payload.tieu_de.length < 2 || payload.tieu_de.length > 200) return Alert.alert('Kiểm tra thông tin', 'Tiêu đề phải từ 2 đến 200 ký tự.');
    if (payload.noi_dung.length < 10 || payload.noi_dung.length > 5000) return Alert.alert('Kiểm tra thông tin', 'Nội dung phải từ 10 đến 5.000 ký tự.');

    setSending(true);
    try {
      await contactService.create(payload);
      Alert.alert('Đã gửi liên hệ', 'Cửa hàng đã nhận được nội dung của bạn và sẽ phản hồi sớm.', [{ text: 'Đóng', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Không thể gửi', getApiMessage(error, 'Vui lòng thử lại sau.'));
    } finally {
      setSending(false);
    }
  };

  const field = (key: keyof Form, label: string, placeholder: string, multiline = false) => (
    <View style={styles.field} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={form[key]}
        onChangeText={value => setField(key, value)}
        editable={!sending}
        placeholder={placeholder}
        placeholderTextColor="#84938B"
        multiline={multiline}
        maxLength={key === 'noi_dung' ? 5000 : key === 'tieu_de' ? 200 : 100}
        keyboardType={key === 'email' ? 'email-address' : key === 'so_dien_thoai' ? 'phone-pad' : 'default'}
        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.multiline]}
      />
      {key === 'noi_dung' ? <Text style={styles.counter}>{form.noi_dung.length}/5000</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={22} color="#183C35" /><Text style={styles.backText}>Tài khoản</Text></Pressable>
          <ScreenHeading eyebrow="KẾT NỐI VỚI CỬA HÀNG" title="Gửi liên hệ" subtitle="Để lại câu hỏi hoặc góp ý, chúng tôi sẽ phản hồi sớm." icon="support-agent" />
          <View style={styles.card}>
            {field('ho_ten', 'Họ tên *', 'Nhập họ và tên')}
            {field('email', 'Email *', 'you@example.com')}
            {field('so_dien_thoai', 'Số điện thoại', 'Ví dụ: 0900000001')}
            {field('tieu_de', 'Tiêu đề *', 'Bạn muốn trao đổi điều gì?')}
            {field('noi_dung', 'Nội dung *', 'Viết nội dung liên hệ của bạn...', true)}
            <Pressable accessibilityRole="button" disabled={sending} onPress={submit} style={[styles.button, sending && styles.disabled]}>
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>{sending ? 'Đang gửi...' : 'Gửi liên hệ'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, gap: 16, paddingBottom: 36, width: '100%', maxWidth: 760, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  backText: { color: '#183C35', fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 22, padding: 18, gap: 14 },
  field: { gap: 7 },
  label: { color: '#183C35', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 12, color: '#183C35', fontSize: 15, paddingHorizontal: 14, backgroundColor: '#FAFCF8' },
  multiline: { minHeight: 140, paddingTop: 12, textAlignVertical: 'top' },
  counter: { color: '#6D7D76', fontSize: 11, textAlign: 'right' },
  button: { minHeight: 54, borderRadius: 14, backgroundColor: '#176B52', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
