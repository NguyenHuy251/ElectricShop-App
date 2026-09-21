import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shop } from '@/constants/shop-theme';

export function AuthShell({ children, register = false }: PropsWithChildren<{ register?: boolean }>) {
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brand}><View style={styles.brandIcon}><MaterialIcons name="bolt" size={25} color={shop.accent} /></View><Text style={styles.brandText}>ELECTRIC SHOP</Text><Text style={styles.brandNote}>FOR YOUR HOME</Text></View>
        <View style={[styles.hero, register && styles.compactHero]}>
          <View style={styles.circle} /><MaterialIcons name={register ? 'spa' : 'weekend'} size={105} color="#ABC39B" style={styles.illustration} />
          <Text style={styles.heroEyebrow}>NHÀ LÀ NƠI ĐỂ TẬN HƯỞNG</Text>
          <Text style={styles.heroTitle}>{register ? 'Bắt đầu một\ntrải nghiệm mới.' : 'Sống tiện nghi.\nYêu từng góc nhỏ.'}</Text>
          <Text style={styles.heroNote}>Thiết bị cho nhà. Thời gian cho bạn.</Text>
        </View>
        <View style={styles.form}>{children}</View>
        <Text style={styles.footer}>Electric Shop · Đồng hành cùng tổ ấm</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function AuthField({ placeholder, secureTextEntry, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}>
    <Text style={styles.label}>{placeholder}</Text>
    <View style={[styles.inputRow, focused && styles.focused]}>
      <TextInput {...props} placeholder={placeholder} accessibilityLabel={placeholder} placeholderTextColor="#94A098" secureTextEntry={secureTextEntry && !visible} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
      {secureTextEntry ? <Pressable accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onPress={() => setVisible(!visible)} style={styles.eye}><MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={20} color={shop.muted} /></Pressable> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: shop.background }, flex: { flex: 1 },
  content: { flexGrow: 1, padding: 22, width: '100%', maxWidth: 540, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  brandIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: shop.ink, alignItems: 'center', justifyContent: 'center' },
  brandText: { color: shop.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.8 },
  brandNote: { color: shop.muted, fontSize: 7, letterSpacing: 0.8, marginLeft: 'auto' },
  hero: { backgroundColor: shop.ink, padding: 24, borderRadius: 26, minHeight: 205, overflow: 'hidden', marginBottom: 28 },
  compactHero: { minHeight: 180 },
  circle: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#2C5140', position: 'absolute', right: -65, bottom: -60 },
  illustration: { position: 'absolute', right: -10, bottom: 10, opacity: 0.35, transform: [{ rotate: '-12deg' }] },
  heroEyebrow: { color: shop.accent, fontSize: 8, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 28, lineHeight: 36, letterSpacing: -0.6, marginTop: 16 },
  heroNote: { color: '#D2DFD1', fontSize: 11, marginTop: 14 },
  form: { paddingHorizontal: 2 },
  footer: { color: shop.muted, fontSize: 10, textAlign: 'center', paddingVertical: 26 },
  field: { marginBottom: 16 },
  label: { color: shop.ink, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  inputRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: shop.border, alignItems: 'center' },
  focused: { borderColor: shop.primary },
  input: { flex: 1, minHeight: 52, paddingHorizontal: 15, color: shop.ink, fontSize: 14 },
  eye: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
