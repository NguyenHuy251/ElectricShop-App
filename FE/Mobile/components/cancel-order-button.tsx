import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { orderService } from '@/services/order.service';
import { getApiMessage } from '@/utils/format';

export function CancelOrderButton({ orderId, onCanceled }: { orderId: number; onCanceled: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const cancel = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try { await orderService.cancelOrder(orderId); setOpen(false); await onCanceled(); }
    catch (err) { setError(getApiMessage(err, 'Không thể hủy đơn hàng.')); }
    finally { busy.current = false; setLoading(false); }
  };
  return <>
    <Pressable accessibilityRole="button" onPress={() => { setError(''); setOpen(true); }} style={styles.cancel}><Text style={styles.danger}>Hủy đơn hàng</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!loading) setOpen(false); }}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.card}>
        <Text style={styles.title}>Hủy đơn #{orderId}?</Text>
        <Text style={styles.message}>Chỉ có thể hủy khi đơn đang chờ xác nhận. Sản phẩm sẽ được hoàn lại vào tồn kho của cửa hàng.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.danger}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={cancel} style={styles.cancel}><Text style={styles.danger}>{loading ? 'Đang hủy...' : 'Xác nhận hủy đơn'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => setOpen(false)} style={styles.keep}><Text style={{ color: '#fff', fontWeight: '700' }}>Giữ lại đơn hàng</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  cancel: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EACACA', alignItems: 'center', marginTop: 8 }, danger: { color: '#A52D2D', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  overlay: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 24 }, card: { backgroundColor: '#fff', padding: 24, borderRadius: 22, width: '100%', maxWidth: 440, gap: 16 }, title: { color: '#183C35', fontSize: 21, fontWeight: '800' }, message: { color: '#6D7D76', fontSize: 14, lineHeight: 22 }, keep: { backgroundColor: '#176B52', padding: 16, borderRadius: 12, alignItems: 'center' },
});
