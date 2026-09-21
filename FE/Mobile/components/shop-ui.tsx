import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import { cardShadow, shop } from '@/constants/shop-theme';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function ScreenHeading({ eyebrow, title, subtitle, icon }: { eyebrow: string; title: string; subtitle?: string; icon: IconName }) {
  return <View style={styles.headingRow}>
    <View style={styles.headingCopy}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>
    <View style={styles.headingIcon}><MaterialIcons name={icon} size={25} color={shop.primary} /></View>
  </View>;
}

export function ProductImage({ uri, style }: { uri?: string | null; style?: StyleProp<ImageStyle> }) {
  const [failedUri, setFailedUri] = useState<string>();
  if (!uri || failedUri === uri) return <View style={[styles.imageFallback, style]}><MaterialIcons name="electrical-services" size={36} color={shop.muted} /><Text style={styles.fallbackText}>Electric Shop</Text></View>;
  return <Image source={{ uri }} resizeMode="contain" style={style} onError={() => setFailedUri(uri)} />;
}

export function ProductCard({ product }: { product: Product }) {
  return <Link href={{ pathname: '/product/[id]', params: { id: String(product.ma_san_pham) } }} asChild>
    <Pressable accessibilityLabel={`Xem ${product.ten_san_pham}`} style={styles.product} android_ripple={{ color: shop.soft }}>
      <View style={styles.imageWrap}><ProductImage uri={product.hinh_anh} style={styles.productImage} /><View style={styles.productArrow}><MaterialIcons name="north-east" size={16} color={shop.ink} /></View></View>
      <View style={styles.productCopy}>
        <Text numberOfLines={1} style={styles.productCategory}>{product.ten_thuong_hieu || product.ten_danh_muc || 'ĐIỆN GIA DỤNG'}</Text>
        <Text numberOfLines={2} style={styles.productName}>{product.ten_san_pham}</Text>
        <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
        <View style={styles.stockRow}><View style={[styles.dot, Number(product.so_luong) <= 0 && { backgroundColor: shop.danger }]} /><Text style={styles.stock}>{Number(product.so_luong) > 0 ? 'Có sẵn' : 'Hết hàng'}</Text></View>
      </View>
    </Pressable>
  </Link>;
}

export function EmptyState({ icon, title, message, action, onAction }: { icon: IconName; title: string; message?: string; action?: string; onAction?: () => void }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name={icon} size={36} color={shop.primary} /></View><Text style={styles.emptyTitle}>{title}</Text>{message ? <Text style={styles.emptyMessage}>{message}</Text> : null}{action && onAction ? <Pressable accessibilityRole="button" style={styles.action} onPress={onAction}><Text style={styles.actionText}>{action}</Text><MaterialIcons name="arrow-forward" size={18} color="#fff" /></Pressable> : null}</View>;
}

export function LoadingState({ message }: { message: string }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><ActivityIndicator size="large" color={shop.primary} /></View><Text style={styles.emptyMessage}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 8 },
  headingCopy: { flex: 1 },
  eyebrow: { color: shop.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: shop.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 7 },
  subtitle: { color: shop.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  headingIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: shop.soft, alignItems: 'center', justifyContent: 'center' },
  product: { flex: 1, overflow: 'hidden', borderRadius: 22, backgroundColor: shop.surface, borderWidth: 1, borderColor: shop.border, ...cardShadow },
  imageWrap: { backgroundColor: '#EEF2E9', margin: 7, borderRadius: 16, overflow: 'hidden' },
  productImage: { width: '100%', aspectRatio: 1.05 },
  productArrow: { position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFFE6', justifyContent: 'center', alignItems: 'center' },
  productCopy: { padding: 12, paddingTop: 8 },
  productCategory: { color: shop.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  productName: { color: shop.ink, fontSize: 13, fontWeight: '700', lineHeight: 19, minHeight: 38, marginTop: 6 },
  price: { color: shop.primary, fontSize: 16, fontWeight: '800', marginTop: 10, letterSpacing: -0.4 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: shop.primary },
  stock: { color: shop.muted, fontSize: 10 },
  imageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: shop.soft, gap: 8 },
  fallbackText: { color: shop.muted, fontSize: 10, letterSpacing: 1 },
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20, gap: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: shop.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: shop.ink, textAlign: 'center' },
  emptyMessage: { color: shop.muted, lineHeight: 22, fontSize: 14, textAlign: 'center', maxWidth: 290 },
  action: { minHeight: 48, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: shop.primary, borderRadius: 16, paddingHorizontal: 22, marginTop: 8 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
