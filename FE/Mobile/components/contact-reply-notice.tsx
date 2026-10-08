import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';

type ReplyNotification = { ma_thong_bao: number; tieu_de: string; noi_dung: string; da_doc: boolean | number };

export function ContactReplyNotice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<ReplyNotification | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const session = useRef<string | null>(null);
  const dismissed = useRef(new Set<number>());
  const lock = useRef(false);
  useEffect(() => {
    let active = true, polling = false;
    const poll = async () => {
      if (polling || AppState.currentState !== 'active') return;
      polling = true;
      try {
        const token = await AsyncStorage.getItem('token');
        if (!active) return;
        if (!token) { setNotice(null); session.current = null; return; }
        if (session.current !== token) { setNotice(null); dismissed.current.clear(); session.current = token; }
        const response = await api.get('/shop/notifications');
        if (!active || await AsyncStorage.getItem('token') !== token) return;
        const rows: ReplyNotification[] = response.data.data || [];
        setNotice(rows.find(row => !row.da_doc && !dismissed.current.has(row.ma_thong_bao) && ['Contact reply','Phản hồi liên hệ'].includes(row.tieu_de)) || null);
      } catch { /* Retry on the next foreground poll. */ }
      finally { polling = false; }
    };
    void poll();
    const timer = setInterval(() => void poll(), 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void poll(); });
    return () => { active = false; clearInterval(timer); listener.remove(); };
  }, []);
  const read = async (openHistory: boolean) => {
    if (!notice || lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      await api.put(`/shop/notifications/${notice.ma_thong_bao}/read`);
      dismissed.current.add(notice.ma_thong_bao); setNotice(null);
      if (openHistory) router.push('/contact-history');
    } catch { setError('Chưa thể mở thông báo. Vui lòng thử lại.'); }
    finally { lock.current = false; setSaving(false); }
  };
  if (!notice) return null;
  return <View accessibilityLiveRegion="polite" style={[styles.banner,{top:insets.top+56}]}>
    <Text style={styles.title}>Cửa hàng đã phản hồi liên hệ</Text>
    <Text style={styles.body}>{notice.noi_dung}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={saving} onPress={() => void read(true)} style={styles.button}><Text style={styles.link}>{saving ? 'Đang mở...' : 'Xem phản hồi'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={saving} onPress={() => void read(false)} style={styles.button}><Text style={styles.body}>Đóng</Text></Pressable>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  banner: { position:'absolute',left:16,right:16,zIndex:1000,elevation:12,maxWidth:700,alignSelf:'center',padding:16,borderRadius:16,backgroundColor:'#E7F1E9',borderWidth:1,borderColor:'#BCD6C6',gap:8 },
  title: { color:'#176B52',fontSize:14,fontWeight:'800' },
  body: { color:'#183C35',fontSize:13,lineHeight:20 },
  actions: { flexDirection:'row',justifyContent:'space-between',gap:16 },
  button: { paddingVertical:8,paddingHorizontal:4 },
  link: { color:'#176B52',fontSize:13,fontWeight:'700' },
  error: { color:'#A52D2D',fontSize:12 },
});
