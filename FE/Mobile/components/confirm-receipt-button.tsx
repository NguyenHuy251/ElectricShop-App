import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { orderService } from '@/services/order.service';
import { getApiMessage } from '@/utils/format';

export function ConfirmReceiptButton({ orderId, onConfirmed }: { orderId: number; onConfirmed: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const confirm = async () => {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError('');
    try {
      await orderService.confirmReceipt(orderId);
      setOpen(false); onConfirmed();
    } catch (err) { setError(getApiMessage(err, 'Không thể xác nhận nhận hàng. Vui lòng thử lại.')); }
    finally { busy.current = false; setLoading(false); }
  };
  return <>
    <Text style={styles.hint}>Khi đã nhận đủ sản phẩm, hãy xác nhận để hoàn tất đơn hàng và đánh giá sản phẩm.</Text>
    <Pressable accessibilityRole="button" onPress={() => { setError(''); setOpen(true); }} style={styles.primary}><Text style={styles.buttonText}>Xác nhận đã nhận hàng</Text></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!busy.current) setOpen(false); }}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.card}>
        <Text style={styles.title}>Bạn đã nhận đơn #{orderId}?</Text>
        <Text style={styles.hint}>Chỉ xác nhận khi bạn đã nhận được hàng. Sau khi xác nhận, đơn sẽ chuyển sang Đã giao.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} accessibilityState={{disabled:loading,busy:loading}} onPress={confirm} style={[styles.primary,loading && {opacity:0.6}]}><Text style={styles.buttonText}>{loading ? 'Đang xác nhận...' : 'Tôi đã nhận hàng'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={loading} onPress={() => setOpen(false)} style={styles.secondary}><Text style={styles.secondaryText}>Chưa nhận hàng</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  hint: { color:'#6D7D76',fontSize:13,lineHeight:21,marginBottom:12 },
  primary: { backgroundColor:'#176B52',padding:16,borderRadius:12,alignItems:'center' },
  buttonText: { color:'#fff',fontWeight:'700',fontSize:14 },
  secondary: { padding:14,alignItems:'center',borderWidth:1,borderColor:'#DAE5DD',borderRadius:12 },
  secondaryText: { color:'#176B52',fontWeight:'700' },
  overlay: { flex:1,backgroundColor:'#00000066',alignItems:'center',justifyContent:'center',padding:24 },
  card: { backgroundColor:'#fff',padding:24,borderRadius:22,width:'100%',maxWidth:440,gap:12 },
  title: { color:'#183C35',fontSize:21,fontWeight:'800' },
  error: { color:'#A52D2D',fontSize:13,lineHeight:20 },
});
