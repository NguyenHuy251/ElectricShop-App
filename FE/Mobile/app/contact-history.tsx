import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState } from '../components/shop-ui';
import { contactService } from '../services/contact.service';
import type { Contact } from '../types';
import { formatDate, getApiMessage } from '../utils/format';

export default function ContactHistoryScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const { data } = await contactService.getMine();
      if (!active.current) return;
      setContacts(data.data || []);
      setError('');
    } catch (err) {
      if (!active.current) return;
      setError(getApiMessage(err, 'Không thể tải phản hồi của bạn.'));
    } finally {
      busy.current = false;
      if (active.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true; void load();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { active.current = false; clearInterval(timer); listener.remove(); };
  }, [load]));

  if (loading) return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải liên hệ của bạn..." /></SafeAreaView>;
  if (error && !contacts.length) return <SafeAreaView style={styles.safe}><EmptyState icon="forum" title="Chưa tải được liên hệ" message={error} action="Thử lại" onAction={load} /></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['bottom']}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <Pressable accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={22} color="#183C35" /><Text style={styles.backText}>Tài khoản</Text></Pressable>
      <Text style={styles.eyebrow}>HỖ TRỢ KHÁCH HÀNG</Text>
      <Text style={styles.title}>Phản hồi của tôi</Text>
      <Text style={styles.subtitle}>Theo dõi các câu hỏi và trả lời từ cửa hàng.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!contacts.length ? <View style={styles.empty}><MaterialIcons name="forum" size={30} color="#176B52" /><Text style={styles.emptyTitle}>Bạn chưa gửi liên hệ nào</Text><Pressable onPress={() => router.push('/contact')}><Text style={styles.link}>Gửi liên hệ đầu tiên</Text></Pressable></View> : contacts.map(contact => <View key={contact.ma_lien_he} style={styles.card}>
        <View style={styles.row}><Text style={styles.subject}>{contact.tieu_de}</Text><View style={[styles.badge, contact.trang_thai === 'DaPhanHoi' ? styles.replied : styles.waiting]}><Text style={styles.badgeText}>{contact.trang_thai === 'DaPhanHoi' ? 'Đã phản hồi' : 'Chờ phản hồi'}</Text></View></View>
        <Text style={styles.date}>{contact.ngay_gui ? formatDate(contact.ngay_gui) : ''}</Text>
        <Text style={styles.body}>{contact.noi_dung}</Text>
        {contact.phan_hoi ? <View style={styles.reply}><Text style={styles.replyLabel}>Phản hồi từ cửa hàng</Text><Text style={styles.body}>{contact.phan_hoi}</Text><Text style={styles.date}>{contact.ngay_phan_hoi ? formatDate(contact.ngay_phan_hoi) : ''}</Text></View> : <Text style={styles.muted}>Cửa hàng sẽ phản hồi sớm.</Text>}
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, gap: 14, paddingBottom: 36, width: '100%', maxWidth: 760, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  backText: { color: '#183C35', fontSize: 14, fontWeight: '700' },
  eyebrow: { color: '#176B52', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#183C35', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#6D7D76', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 20, padding: 17, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  subject: { flex: 1, color: '#183C35', fontSize: 16, fontWeight: '800' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  waiting: { backgroundColor: '#F8EEDB' },
  replied: { backgroundColor: '#E7F1E9' },
  badgeText: { color: '#183C35', fontSize: 11, fontWeight: '800' },
  date: { color: '#84938B', fontSize: 12 },
  body: { color: '#52675D', fontSize: 14, lineHeight: 22 },
  reply: { backgroundColor: '#EDF4E9', borderRadius: 13, padding: 13, gap: 6, marginTop: 5 },
  replyLabel: { color: '#176B52', fontSize: 12, fontWeight: '800' },
  muted: { color: '#84938B', fontSize: 13 },
  error: { color: '#A52D2D', fontSize: 13 },
  empty: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 10 },
  emptyTitle: { color: '#183C35', fontSize: 15, fontWeight: '800' },
  link: { color: '#176B52', fontSize: 13, fontWeight: '800', paddingVertical: 5 },
});
