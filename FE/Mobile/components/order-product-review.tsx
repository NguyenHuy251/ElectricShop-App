import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { productService } from '@/services/product.service';
import type { ProductReview } from '@/types';
import { getApiMessage } from '@/utils/format';

export function OrderProductReview({ orderId, productId, review }: {
  orderId: number; productId: number; review?: ProductReview;
}) {
  const [saved, setSaved] = useState(review);
  const [expanded, setExpanded] = useState(false);
  const [stars, setStars] = useState(0);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const current = saved || review;

  async function submit() {
    if (busy.current) return;
    if (!stars) { setError('Vui lòng chọn số sao trước khi gửi.'); return; }
    busy.current = true; setSending(true); setError('');
    try {
      const result = await productService.createReview({ ma_don_hang: orderId, ma_san_pham: productId, so_sao: stars, noi_dung: content.trim() });
      setSaved({ ma_danh_gia: result.data.ma_danh_gia, ma_san_pham: productId, ho_ten: '', so_sao: stars, noi_dung: content.trim() });
    } catch (err) { setError(getApiMessage(err, 'Chưa gửi được đánh giá. Vui lòng thử lại.')); }
    finally { busy.current = false; setSending(false); }
  }

  return <View style={styles.container}>
    {current ? <View accessibilityLiveRegion="polite">
      <Text style={styles.title}>Đã đánh giá · {'★'.repeat(current.so_sao)}{'☆'.repeat(5 - current.so_sao)}</Text>
      {current.noi_dung ? <Text style={styles.body}>{current.noi_dung}</Text> : null}
    </View> : <>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} disabled={sending} style={styles.toggle}>
        <MaterialIcons name="rate-review" size={19} color="#176B52" />
        <Text style={styles.title}>{expanded ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm'}</Text>
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={20} color="#176B52" />
      </Pressable>
      {expanded ? <View style={styles.form}>
        <Text style={styles.body}>Bạn cảm thấy sản phẩm như thế nào?</Text>
        <View style={styles.stars}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} sao`} accessibilityState={{ selected: stars === value, disabled: sending }} disabled={sending} onPress={() => { setStars(value); setError(''); }} style={styles.star}>
          <MaterialIcons name={value <= stars ? 'star' : 'star-border'} size={32} color="#B87D16" />
        </Pressable>)}</View>
        <TextInput accessibilityLabel="Nhận xét sản phẩm" placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)" placeholderTextColor="#6D7D76" multiline maxLength={2000} value={content} onChangeText={setContent} editable={!sending} style={styles.input} />
        <Text style={styles.counter}>{content.length}/2000</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: sending }} disabled={sending} onPress={submit} style={[styles.submit, sending && { opacity: 0.6 }]}>
          <Text style={styles.submitText}>{sending ? 'Đang gửi...' : 'Gửi đánh giá'}</Text>
        </Pressable>
      </View> : null}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2E9' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  title: { color: '#176B52', fontSize: 13, fontWeight: '700' },
  body: { color: '#52675D', fontSize: 13, marginTop: 6, lineHeight: 20 },
  form: { gap: 8 },
  stars: { flexDirection: 'row', flexWrap: 'wrap' },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#D9E4DA', borderRadius: 12, padding: 12, minHeight: 96, textAlignVertical: 'top', color: '#183C35', fontSize: 14 },
  counter: { textAlign: 'right', color: '#6D7D76', fontSize: 11 },
  error: { color: '#BC4545', fontSize: 13 },
  submit: { backgroundColor: '#176B52', borderRadius: 12, padding: 13, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
