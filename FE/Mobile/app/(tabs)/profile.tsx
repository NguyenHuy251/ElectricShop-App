import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState, ScreenHeading } from '@/components/shop-ui';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';
import { getApiMessage, getInitials } from '../../utils/format';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ho_ten: '', email: '', so_dien_thoai: '', dia_chi: '' });

  const loadProfile = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
      setForm({
        ho_ten: response.data.ho_ten || '',
        email: response.data.email || '',
        so_dien_thoai: response.data.so_dien_thoai || '',
        dia_chi: response.data.dia_chi || '',
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadProfile();
  }, [loadProfile]));

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.ho_ten.trim() || !form.email.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và email');
      return;
    }

    setSaving(true);
    try {
      const response = await authService.updateMe(form);
      setUser(response.data);
      setEditing(false);
      Alert.alert('Thành công', 'Thông tin tài khoản đã được cập nhật');
    } catch (error) {
      Alert.alert('Lỗi', getApiMessage(error, 'Không thể cập nhật thông tin tài khoản'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/login' as any);
    Alert.alert('Thông báo', 'Đã đăng xuất');
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải tài khoản..." /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeading eyebrow="GÓC RIÊNG CỦA BẠN" title="Xin chào, bạn!" subtitle="Mọi thông tin mua sắm, trong tầm tay." icon="person-outline" />

        {user ? (
          <View style={styles.card}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.ho_ten)}</Text></View>
            <View style={styles.profileInfo}>
              <Text style={styles.memberLabel}>THÀNH VIÊN ELECTRIC SHOP</Text>
              <Text style={styles.name}>{user.ho_ten}</Text>
              <Text style={styles.meta}>{user.email}</Text>
              <Text style={styles.meta}>{user.so_dien_thoai || 'Chưa có số điện thoại'}</Text>
            </View>
            <Pressable accessibilityLabel="Chỉnh sửa thông tin tài khoản" onPress={() => setEditing(true)} style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color="#183C35" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}><Text style={styles.muted}>Chưa có dữ liệu tài khoản</Text></View>
        )}

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.formTitle}>Cập nhật thông tin</Text>
            <TextInput style={styles.input} value={form.ho_ten} onChangeText={(value) => updateField('ho_ten', value)} placeholder="Họ tên" placeholderTextColor="#84938B" />
            <TextInput style={styles.input} value={form.email} onChangeText={(value) => updateField('email', value)} placeholder="Email" placeholderTextColor="#84938B" keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} value={form.so_dien_thoai} onChangeText={(value) => updateField('so_dien_thoai', value)} placeholder="Số điện thoại" placeholderTextColor="#84938B" keyboardType="phone-pad" />
            <TextInput style={[styles.input, styles.addressInput]} value={form.dia_chi} onChangeText={(value) => updateField('dia_chi', value)} placeholder="Địa chỉ giao hàng" placeholderTextColor="#84938B" multiline />
            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={() => setEditing(false)} disabled={saving}><Text style={styles.cancelText}>Hủy</Text></Pressable>
              <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}><Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text></Pressable>
            </View>
          </View>
        ) : null}

<Text style={styles.menuLabel}>MUA SẮM & GIAO NHẬN</Text>
        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/orders' as any)}>
            <MaterialIcons name="receipt-long" size={22} color="#176B52" />
            <Text style={styles.menuText}>Đơn hàng của tôi</Text>
            <MaterialIcons name="chevron-right" size={23} color="#84938B" />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/cart' as any)}>
            <MaterialIcons name="shopping-cart" size={22} color="#176B52" />
            <Text style={styles.menuText}>Giỏ hàng</Text>
            <MaterialIcons name="chevron-right" size={23} color="#84938B" />
          </Pressable>
          <View style={styles.menuItem}>
            <MaterialIcons name="location-on" size={22} color="#176B52" />
            <Text style={styles.menuText}>{user?.dia_chi || 'Chưa có địa chỉ giao hàng'}</Text>
          </View>
        </View>

<View style={styles.profileNote}><MaterialIcons name="spa" size={28} color="#176B52" /><Text style={styles.profileNoteText}>Cảm ơn bạn đã để Electric Shop đồng hành cùng tổ ấm.</Text></View>
        <Pressable style={styles.logout} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#BC4545" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  memberLabel: { color: '#DDF3A3', fontSize: 8, letterSpacing: 1, fontWeight: '700', marginBottom: 6 },
  menuLabel: { color: '#6D7D76', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 30 },
  profileNote: { backgroundColor: '#E7F1E9', borderRadius: 22, padding: 20, flexDirection: 'row', gap: 12, alignItems: 'center', marginVertical: 24 },
  profileNoteText: { flex: 1, color: '#596C62', fontSize: 13, lineHeight: 21 },
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  container: { flexGrow: 1, padding: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
  muted: { color: '#6D7D76' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#183C35', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#EAF0E7' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#35604B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: '800' },
  meta: { color: '#CFDBD0', fontSize: 13, marginTop: 4 },
  menu: { backgroundColor: '#fff', borderRadius: 22, marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EAF0E7' },
  menuItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EDF2E9' },
  menuText: { color: '#183C35', fontSize: 14, fontWeight: '700', flex: 1 },
  logout: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 16, padding: 17 },
  logoutText: { color: '#BC4545', fontWeight: '800' },
  keyboard: { flex: 1 },
  editButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#DDF3A3', alignItems: 'center', justifyContent: 'center' },
  editForm: { backgroundColor: '#fff', borderRadius: 22, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#EAF0E7' },
  formTitle: { color: '#183C35', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 14, paddingHorizontal: 12, color: '#183C35', marginBottom: 10, backgroundColor: '#fff' },
  addressInput: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#EDF2E9', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#183C35', fontWeight: '800' },
  saveButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#176B52', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
