import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoucherList } from '@/components/voucher-list';
export default function VouchersScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.safe} edges={['bottom']}><View style={styles.content}><VoucherList onSelect={code => router.push({ pathname: '/checkout', params: { ma_giam_gia: code } })} /></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' } });
