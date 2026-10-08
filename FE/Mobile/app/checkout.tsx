import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage } from '../components/shop-ui';
import { authService } from '../services/auth.service';
import { orderService } from '../services/order.service';
import api from '../services/api';
import type { CheckoutPayload, CheckoutQuote, CheckoutSelection } from '../types';
import { formatCurrency, getApiMessage } from '../utils/format';
import { VoucherCard } from '../components/voucher-card';
import { voucherService, type CustomerVoucher } from '../services/voucher.service';

type Form = Pick<CheckoutPayload, 'ho_ten_nguoi_nhan' | 'so_dien_thoai' | 'dia_chi_giao_hang' | 'ghi_chu'>;
type Attempt = { payload: CheckoutPayload; quote: CheckoutQuote };
const blank: Form = { ho_ten_nguoi_nhan: '', so_dien_thoai: '', dia_chi_giao_hang: '', ghi_chu: '' };

export default function CheckoutScreen() {
  const { source, productId, quantity, variantId } = useLocalSearchParams<{ source?: string; productId?: string; quantity?: string; variantId?: string }>();
  const router = useRouter();
  if ((variantId !== undefined && (source !== 'buy_now' || !/^\d+$/.test(variantId) || !Number.isSafeInteger(Number(variantId)) || Number(variantId) < 1)) || (source !== undefined && source !== 'cart' && source !== 'buy_now') || (source !== 'buy_now' && (productId !== undefined || quantity !== undefined)) || (source === 'buy_now' && (!/^\d+$/.test(productId || '') || !Number.isSafeInteger(Number(productId)) || !/^\d+$/.test(quantity || '') || Number(productId) < 1 || Number(quantity) < 1 || Number(quantity) > 999))) {
    return <EmptyState icon="error-outline" title="Thông tin mua hàng không hợp lệ" action="Chọn sản phẩm" onAction={() => router.replace('/products')} />;
  }
  return <CheckoutContent key={`${source || 'cart'}:${productId}:${quantity}:${variantId}`} initialSelection={source === 'buy_now' ? { source, ma_san_pham: Number(productId), so_luong: Number(quantity), ...(variantId ? { ma_bien_the: Number(variantId) } : {}) } : {}} />;
}

function CheckoutContent({ initialSelection }: { initialSelection: CheckoutSelection }) {
  const router = useRouter();
  const [selection, setSelection] = useState(initialSelection);
  const [code,setCode]=useState('');
  const [showVouchers, setShowVouchers] = useState(false);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [addresses,setAddresses]=useState<{ma_dia_chi:number;ho_ten:string;so_dien_thoai:string;dia_chi:string;mac_dinh:boolean}[]>([]);
  const activeSelection = useRef(initialSelection);
  const [form, setForm] = useState<Form>(blank);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uncertain, setUncertain] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const pending = useRef<Attempt | null>(null);
  const storageKey = useRef('');
  const busy = useRef(false);

  const load = useCallback(() => authService.getMe().then(async ({ data: user }) => {
      setError('');
      storageKey.current = `checkout:pending:${user.ma_tai_khoan}`;
      const saved = await AsyncStorage.getItem(storageKey.current);
      if (saved) {
        const attempt: Attempt = JSON.parse(saved);
        activeSelection.current = attempt.payload.source === 'buy_now' ? { source: 'buy_now', ma_san_pham: attempt.payload.ma_san_pham, ma_bien_the: attempt.payload.ma_bien_the, so_luong: attempt.payload.so_luong,ma_code:attempt.payload.ma_code } : {ma_code:attempt.payload.ma_code};
        setCode(attempt.payload.ma_code || '');
        setSelection(activeSelection.current);
        pending.current = attempt;
        setForm(attempt.payload);
        setQuote(attempt.quote);
        setReview(true);
        setConfirmed(true);
        setUncertain(true);
      } else {
        const { data } = await orderService.getCheckout(activeSelection.current);
        setQuote(data);
        setForm(current => ({ ...current, ho_ten_nguoi_nhan: current.ho_ten_nguoi_nhan || user.ho_ten || '', so_dien_thoai: current.so_dien_thoai || user.so_dien_thoai || '', dia_chi_giao_hang: current.dia_chi_giao_hang || user.dia_chi || '' }));
      }
    }).catch(err => setError(getApiMessage(err, 'Không thể tải thông tin thanh toán.')))
      .finally(() => setLoading(false)), []);

  useEffect(() => { void load(); }, [load]);
  useEffect(()=>{void api.get('/shop/addresses').then(r=>setAddresses(r.data.data || [])).catch(()=>undefined);},[]);

  const change = (key: keyof Form, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setFieldErrors(current => ({ ...current, [key]: '' }));
    setConfirmed(false);
  };

  const applyCoupon = async (value: string) => {
    if (busy.current) return;
    busy.current = true; setChecking(true); setError('');
    try {
      const next = { ...selection, ma_code: value.trim().toUpperCase() };
      const result = await orderService.getCheckout(next);
      setSelection(next); activeSelection.current = next;
      setCode(next.ma_code); setQuote(result.data); setConfirmed(false);
      setShowVouchers(false);
    } catch (err) { setError(getApiMessage(err, 'Chưa thể áp dụng mã giảm giá.')); }
    finally { busy.current = false; setChecking(false); }
  };

  const toggleVouchers = async () => {
    if (showVouchers) { setShowVouchers(false); return; }
    setShowVouchers(true); setVoucherLoading(true); setVoucherError('');
    try { setVouchers(await voucherService.getMine(quote?.tam_tinh)); }
    catch (err) { setVoucherError(getApiMessage(err, 'Không thể tải danh sách voucher.')); }
    finally { setVoucherLoading(false); }
  };

  const checkForm = async () => {
    if (busy.current) return;
    const next = { ...form, ho_ten_nguoi_nhan: form.ho_ten_nguoi_nhan.trim(), so_dien_thoai: form.so_dien_thoai.replace(/[\s().-]/g, '').replace(/^\+84/, '0'), dia_chi_giao_hang: form.dia_chi_giao_hang.trim(), ghi_chu: form.ghi_chu.trim() };
    const errors: Record<string, string> = {};
    if (next.ho_ten_nguoi_nhan.length < 2 || next.ho_ten_nguoi_nhan.length > 100) errors.ho_ten_nguoi_nhan = 'Nhập họ tên từ 2 đến 100 ký tự.';
    if (!/^0[35789]\d{8}$/.test(next.so_dien_thoai)) errors.so_dien_thoai = 'Nhập số điện thoại di động Việt Nam hợp lệ.';
    if (next.dia_chi_giao_hang.length < 10 || next.dia_chi_giao_hang.length > 255) errors.dia_chi_giao_hang = 'Nhập địa chỉ đầy đủ từ 10 đến 255 ký tự.';
    if (next.ghi_chu.length > 1000) errors.ghi_chu = 'Ghi chú tối đa 1.000 ký tự.';
    setFieldErrors(errors);
    setForm(next);
    if (Object.keys(errors).length) { setError('Vui lòng kiểm tra các thông tin được đánh dấu bên dưới.'); return; }
    setError(''); setConfirmed(false);
    busy.current = true; setChecking(true);
    try {
      const { data } = await orderService.getCheckout(selection);
      setQuote(data);
      if (!data.can_checkout) { setError('Sản phẩm hoặc tồn kho đã thay đổi. Vui lòng kiểm tra lại.'); return; }
      if (quote && quote.snapshot !== data.snapshot) setError('Giá hoặc giỏ hàng đã thay đổi. Vui lòng kiểm tra thông tin mới bên dưới trước khi xác nhận.');
      setReview(true);
    } catch (err) { setError(getApiMessage(err, 'Không thể kiểm tra giá và tồn kho. Vui lòng thử lại.')); }
    finally { busy.current = false; setChecking(false); }
  };

  const submit = async () => {
    if (busy.current || !quote || !quote.can_checkout || !confirmed) return;
    busy.current = true;
    setSubmitting(true);
    setError('');
    try {
      const attempt = pending.current || {
        payload: { ...form, ...selection, phuong_thuc_thanh_toan: 'ThanhToanKhiNhanHang' as const, snapshot: quote.snapshot, request_id: `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}` }, quote,
      };
      // Persist before sending. Retry the same request after refresh or an unknown network outcome.
      await AsyncStorage.setItem(storageKey.current, JSON.stringify(attempt));
      pending.current = attempt;
      const result = await orderService.createOrder(attempt.payload);
      // The server has confirmed the order. A local cleanup failure must not turn it into a failed purchase.
      await AsyncStorage.removeItem(storageKey.current).catch(() => undefined);
      pending.current = null;
      router.replace({ pathname: '/checkout-success', params: { orderId: String(result.data.ma_don_hang) } });
    } catch (err: any) {
      setError(getApiMessage(err, 'Chưa xác định được kết quả đặt hàng. Vui lòng thử lại.'));
      if (err?.response && [400, 409].includes(err.response.status)) {
        try { await AsyncStorage.removeItem(storageKey.current); }
        catch { setUncertain(true); return; }
        pending.current = null;
        setUncertain(false);
        setReview(false);
        setConfirmed(false);
        setFieldErrors(err.response.data?.fieldErrors || {});
        try { setQuote((await orderService.getCheckout(selection)).data); }
        catch { setQuote(null); }
      } else { setUncertain(Boolean(pending.current)); }
    } finally { busy.current = false; setSubmitting(false); }
  };

  if (loading) return <LoadingState message="Đang kiểm tra giỏ hàng và giá bán..." />;
  if (!quote) return <EmptyState icon="wifi-off" title="Chưa tải được thanh toán" message={error} action="Thử lại" onAction={load} />;
  if (!quote.items.length) return <EmptyState icon="shopping-bag" title="Giỏ hàng đang trống" message="Chọn sản phẩm trước khi thanh toán hoặc kiểm tra đơn hàng đã đặt." action="Xem đơn hàng" onAction={() => router.replace('/orders')} />;

  const field = (key: keyof Form, label: string, placeholder: string, maxLength: number, multiline = false) => <View style={styles.field} key={key}>
    <Text style={styles.label}>{label}</Text>
    <TextInput editable={!checking && !submitting} accessibilityLabel={label} value={form[key]} onChangeText={value => change(key, value)} placeholder={placeholder} placeholderTextColor="#84938B" maxLength={maxLength} multiline={multiline} keyboardType={key === 'so_dien_thoai' ? 'phone-pad' : 'default'} autoComplete={key === 'so_dien_thoai' ? 'tel' : key === 'ho_ten_nguoi_nhan' ? 'name' : 'off'} style={[styles.input, multiline && styles.multiline, Boolean(fieldErrors[key]) && styles.invalid]} />
    {fieldErrors[key] ? <Text accessibilityRole="alert" style={styles.errorText}>{fieldErrors[key]}</Text> : null}
  </View>;

  return <SafeAreaView style={styles.safe} edges={['bottom']}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>HOÀN TẤT ĐƠN HÀNG</Text>
        <Text style={styles.title}>{review ? 'Kiểm tra lần cuối' : 'Giao đến người bạn thương'}</Text>
        <Text style={styles.muted}>1. Thông tin nhận hàng  ·  2. Xác nhận đặt hàng</Text>
        {selection.source === 'buy_now' ? <View style={styles.notice}><Text style={styles.label}>Thanh toán ngay sản phẩm đã chọn</Text><Text style={styles.muted}>Đơn này chỉ gồm sản phẩm bên dưới. Các sản phẩm trong giỏ hàng của bạn vẫn được giữ nguyên.</Text></View> : null}
        {error ? <View accessibilityRole="alert" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        {uncertain ? <View style={styles.notice}><Text style={styles.label}>Đang chờ xác nhận kết quả</Text><Text style={styles.muted}>Thông tin đã gửi được giữ nguyên. Thử gửi lại cùng yêu cầu để nhận kết quả, tránh tạo thêm đơn hàng.</Text><Pressable accessibilityRole="button" disabled={submitting} onPress={submit}><Text style={styles.link}>{submitting ? 'Đang kiểm tra...' : 'Thử gửi lại đơn'}</Text></Pressable><Pressable onPress={() => router.push('/orders')}><Text style={styles.link}>Xem danh sách đơn hàng</Text></Pressable></View> : null}
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>{review && !uncertain && !submitting ? <Pressable onPress={() => { setReview(false); setConfirmed(false); }}><Text style={styles.link}>Chỉnh sửa</Text></Pressable> : null}</View>
          {review ? <View style={{ gap: 8 }}><Text style={styles.name}>{form.ho_ten_nguoi_nhan} · {form.so_dien_thoai}</Text><Text style={styles.muted}>{form.dia_chi_giao_hang}</Text>{form.ghi_chu ? <Text style={styles.muted}>Ghi chú: {form.ghi_chu}</Text> : null}</View> : <>
            {addresses.length ? <View style={{gap:8}}><Text style={styles.label}>Chọn từ sổ địa chỉ</Text>{addresses.map(a=><Pressable key={a.ma_dia_chi} disabled={checking || submitting} onPress={()=>{setForm(current=>({...current,ho_ten_nguoi_nhan:a.ho_ten,so_dien_thoai:a.so_dien_thoai,dia_chi_giao_hang:a.dia_chi}));setConfirmed(false);}}><Text style={styles.link}>{a.ho_ten} · {a.dia_chi}{a.mac_dinh?' (Mặc định)':''}</Text></Pressable>)}</View> : null}
            {field('ho_ten_nguoi_nhan', 'Họ tên người nhận *', 'Nhập họ và tên', 100)}
            {field('so_dien_thoai', 'Số điện thoại *', 'Ví dụ: 0912345678', 20)}
            {field('dia_chi_giao_hang', 'Địa chỉ nhận hàng *', 'Số nhà, đường, phường/xã, tỉnh/thành phố', 255, true)}
            <Text style={styles.hint}>Nhập đầy đủ địa chỉ để cửa hàng liên hệ và giao hàng chính xác.</Text>
            {field('ghi_chu', 'Ghi chú (không bắt buộc)', 'Hướng dẫn giao hàng, thời gian tiện liên hệ...', 1000, true)}
          </>}
        </View>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.sectionTitle}>Sản phẩm trong đơn</Text>{!uncertain && !submitting ? <Pressable accessibilityRole="button" onPress={() => selection.source === 'buy_now' ? router.replace({ pathname: '/product/[id]', params: { id: String(selection.ma_san_pham), quantity: String(selection.so_luong) } }) : router.replace('/cart')}><Text style={styles.link}>{selection.source === 'buy_now' ? 'Đổi số lượng' : 'Sửa giỏ hàng'}</Text></Pressable> : null}</View>
          {quote.items.map(item => <View key={`${item.ma_san_pham}:${item.ma_bien_the || 0}`} style={styles.product}>
            <ProductImage uri={item.hinh_anh} style={styles.image} />
            <View style={{ flex: 1 }}><Text style={styles.name}>{item.ten_san_pham}{item.ten_bien_the ? ` - ${item.ten_bien_the}` : ''}</Text><Text style={styles.muted}>{item.so_luong} × {formatCurrency(item.gia_ban)}</Text></View>
            <Text style={styles.amount}>{formatCurrency(Number(item.gia_ban) * item.so_luong)}</Text>
          </View>)}
          {quote.issues.map((issue, index) => <Text key={index} style={styles.errorText}>{issue}</Text>)}
          {!quote.can_checkout ? <><Text style={styles.errorText}>Vui lòng kiểm tra sản phẩm và số lượng trước khi tiếp tục.</Text><Pressable accessibilityRole="button" disabled={checking || submitting} onPress={checkForm}><Text style={styles.link}>Kiểm tra lại giá và tồn kho</Text></Pressable></> : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Giao hàng & thanh toán</Text>
          <View style={styles.payment}><MaterialIcons name="radio-button-checked" size={23} color="#176B52" /><View style={{ flex: 1 }}><Text style={styles.name}>Thanh toán khi nhận hàng (COD)</Text><Text style={styles.muted}>Trả tiền cho nhân viên giao hàng khi nhận đơn. Bạn chưa cần thanh toán lúc đặt hàng.</Text></View></View>
          <View style={styles.notice}><Text style={styles.muted}>Giao hàng tiêu chuẩn · {quote.phi_giao_hang === 0 ? 'Miễn phí giao hàng' : `Phí giao hàng ${formatCurrency(quote.phi_giao_hang)}`}. Cửa hàng sẽ liên hệ xác nhận đơn và thời gian giao phù hợp.</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          {!review && !uncertain ? <View style={{ gap: 10 }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showVouchers }} disabled={checking || submitting || voucherLoading} onPress={() => void toggleVouchers()}><Text style={styles.link}>{showVouchers ? 'Ẩn danh sách voucher' : 'Chọn voucher'}</Text></Pressable>
            {showVouchers ? voucherLoading ? <Text style={styles.muted}>Đang tải voucher...</Text> : voucherError ? <Text accessibilityRole="alert" style={styles.errorText}>{voucherError}</Text> : vouchers.length ? vouchers.map(v => <VoucherCard key={v.ma_voucher} voucher={v} selected={selection.ma_code === v.ma_code} disabled={checking || submitting} onSelect={() => void applyCoupon(v.ma_code)} />) : <Text style={styles.muted}>Chưa có voucher còn hiệu lực cho tài khoản của bạn.</Text> : null}
          </View> : null}
          {!review && !uncertain ? <View style={{gap:8}}><TextInput accessibilityLabel="Mã giảm giá" editable={!checking && !submitting} placeholder="Nhập mã giảm giá" autoCapitalize="characters" autoCorrect={false} value={code} onChangeText={setCode} maxLength={40} style={styles.input}/><View style={styles.row}>
            <Pressable accessibilityRole="button" disabled={checking || submitting} onPress={()=>void applyCoupon(code)}><Text style={styles.link}>{checking?'Đang kiểm tra...':'Áp dụng mã'}</Text></Pressable>
            {selection.ma_code ? <Pressable accessibilityRole="button" disabled={checking || submitting} onPress={()=>void applyCoupon('')}><Text style={styles.link}>Bỏ mã giảm giá</Text></Pressable> : null}
          </View>{selection.ma_code ? <Text style={styles.muted}>Đang áp dụng: {selection.ma_code}</Text> : null}</View> : null}
          <View style={styles.row}><Text style={styles.muted}>Tiền hàng</Text><Text style={styles.amount}>{formatCurrency(quote.tam_tinh)}</Text></View>
          {quote.giam_gia ? <View style={styles.row}><Text style={styles.muted}>Giảm giá</Text><Text style={styles.link}>−{formatCurrency(quote.giam_gia)}</Text></View> : null}
          <View style={styles.row}><Text style={styles.muted}>Phí giao hàng</Text><Text style={styles.link}>{quote.phi_giao_hang === 0 ? 'Miễn phí' : formatCurrency(quote.phi_giao_hang)}</Text></View>
          <View style={[styles.row, styles.total]}><Text style={styles.name}>Tổng thanh toán khi nhận hàng</Text><Text style={styles.totalAmount}>{formatCurrency(quote.tong_tien)}</Text></View>
          {review ? <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed, disabled: submitting || uncertain }} disabled={submitting || uncertain} onPress={() => setConfirmed(value => !value)} style={styles.payment}><MaterialIcons name={confirmed ? 'check-box' : 'check-box-outline-blank'} color="#176B52" size={24} /><Text style={[styles.muted, { flex: 1 }]}>Tôi đã kiểm tra thông tin nhận hàng, sản phẩm và tổng tiền phải trả.</Text></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={checking ? 'Đang kiểm tra giá và tồn kho' : submitting ? 'Đang gửi yêu cầu' : uncertain ? 'Kiểm tra lại đơn' : review ? 'Xác nhận đặt hàng COD' : 'Kiểm tra đơn hàng'} disabled={checking || submitting || !quote.can_checkout || (review && !confirmed)} style={[styles.button, (checking || submitting || !quote.can_checkout || (review && !confirmed)) && styles.disabled]} onPress={review ? submit : checkForm}>
            <Text style={styles.buttonText}>{checking ? 'Đang kiểm tra giá và tồn kho...' : submitting ? 'Đang gửi yêu cầu...' : uncertain ? 'Kiểm tra lại đơn' : review ? 'Xác nhận đặt hàng COD' : 'Kiểm tra đơn hàng'}</Text><MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.hint}>Đơn được tạo ở trạng thái chờ xác nhận. Bạn có thể hủy khi cửa hàng chưa xác nhận đơn.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F2' }, content: { padding: 20, gap: 16, width: '100%', maxWidth: 820, alignSelf: 'center', paddingBottom: 40 },
  eyebrow: { color: '#176B52', fontSize: 10, fontWeight: '800', letterSpacing: 2 }, title: { color: '#183C35', fontSize: 28, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E9E1', borderRadius: 22, padding: 20, gap: 14 }, sectionTitle: { color: '#183C35', fontSize: 17, fontWeight: '800', flexShrink: 1 },
  field: { gap: 7 }, label: { color: '#183C35', fontSize: 13, fontWeight: '700' }, input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D9E2D8', borderRadius: 12, color: '#183C35', fontSize: 15, backgroundColor: '#FAFCF8' },
  multiline: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }, invalid: { borderColor: '#BC4545' }, errorText: { color: '#A52D2D', fontSize: 13, lineHeight: 20 }, errorBox: { backgroundColor: '#FBEDEC', padding: 16, borderRadius: 12 },
  muted: { color: '#6D7D76', fontSize: 13, lineHeight: 21 }, hint: { color: '#6D7D76', fontSize: 12, lineHeight: 19 }, link: { color: '#176B52', fontSize: 13, fontWeight: '700', paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }, name: { color: '#183C35', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  product: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EAF0E7', flexWrap: 'wrap' }, image: { width: 56, height: 56, borderRadius: 10 }, amount: { color: '#183C35', fontWeight: '700', fontSize: 13 },
  payment: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 }, notice: { padding: 14, backgroundColor: '#EDF4E9', borderRadius: 12, gap: 8 }, total: { borderTopWidth: 1, borderColor: '#E3E9E1', paddingTop: 16 }, totalAmount: { color: '#176B52', fontSize: 24, fontWeight: '800' },
  button: { minHeight: 54, backgroundColor: '#176B52', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 14 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 }, disabled: { opacity: 0.5 },
});
