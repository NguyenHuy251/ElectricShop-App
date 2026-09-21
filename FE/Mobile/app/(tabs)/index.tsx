import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartService } from '../../services/cart.service';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { EmptyState, LoadingState, ProductCard } from '@/components/shop-ui';
import { shop } from '@/constants/shop-theme';

const fallbackCategories = [
  { label: 'Nhà bếp', icon: 'kitchen' as const, color: '#EAF5FF' },
  { label: 'Vệ sinh', icon: 'cleaning-services' as const, color: '#FFF2E8' },
  { label: 'Phòng khách', icon: 'weekend' as const, color: '#F2EEFF' },
  { label: 'Chăm sóc', icon: 'health-and-safety' as const, color: '#EAF8F0' },
];

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadHome = useCallback(async () => {
    setError(false);
    try {
      const response = await productService.getProducts({ limit: 4 });
      setProducts(response.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }

    try {
      const cart = await cartService.getCart();
      const count = (cart.data?.items || []).reduce((sum: number, item: any) => sum + Number(item.so_luong || 0), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadHome();
  }, [loadHome]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ELECTRIC SHOP</Text>
            <Text style={styles.heading}>Nhà tiện nghi, sống thảnh thơi.</Text>
          </View>
          <Link href="/cart" asChild>
            <Pressable accessibilityLabel="Mở giỏ hàng" style={styles.iconButton}>
              <MaterialIcons name="shopping-bag" size={23} color="#183C35" />
              {cartCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text></View> : null}
            </Pressable>
          </Link>
        </View>

        <Link href="/products" asChild><Pressable style={styles.searchBar}><MaterialIcons name="search" size={22} color={shop.muted} /><Text style={styles.searchText}>Bạn đang tìm thiết bị gì?</Text><View style={styles.searchArrow}><MaterialIcons name="tune" size={18} color={shop.primary} /></View></Pressable></Link>
        <View style={styles.hero}>
          <View style={styles.heroCircle} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>CHĂM CHÚT TỪNG GÓC NHÀ</Text>
            <Text style={styles.heroTitle}>{'Tiện nghi hơn.\nThảnh thơi hơn.'}</Text>
            <Text style={styles.heroText}>Khám phá thiết bị gia dụng cho nhịp sống của bạn.</Text>
            <Link href="/products" asChild>
              <Pressable style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Khám phá ngay</Text>
                <MaterialIcons name="arrow-forward" size={18} color={shop.ink} />
              </Pressable>
            </Link>
          </View>
<MaterialIcons name="blender" size={116} color="#AFCDA6" style={styles.heroIcon} />
        </View>

        <View style={styles.promise}><MaterialIcons name="electric-bolt" size={18} color={shop.primary} /><Text style={styles.promiseText}>Tiện ích cho nhà · Cảm hứng cho cuộc sống</Text></View>
        <SectionHeader title="Góc nhà của bạn" action="Xem tất cả" href="/products" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {Array.from(new Set(products.map(p => p.ten_danh_muc).filter((name): name is string => Boolean(name)))).map((label, index) => ({ ...fallbackCategories[index % fallbackCategories.length], label })).map((category) => (
            <Link href={{ pathname: '/products', params: { category: category.label } }} key={category.label} asChild>
              <Pressable style={styles.category}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><MaterialIcons name={category.icon} size={26} color="#183C35" /></View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>

        <SectionHeader title="Sản phẩm nổi bật" action="Xem thêm" href="/products" />
        {loading ? <LoadingState message="Đang chọn sản phẩm cho bạn..." /> : error ? <EmptyState icon="wifi-off" title="Chưa tải được sản phẩm" message="Kiểm tra kết nối và thử lại nhé." action="Thử lại" onAction={loadHome} /> : !products.length ? <EmptyState icon="inventory-2" title="Sản phẩm đang được cập nhật" /> : (
          <View style={styles.productRow}>{products.map(product => <View key={product.ma_san_pham} style={styles.productCell}><ProductCard product={product} /></View>)}</View>
        )}
        <Link href="/products" asChild><Pressable style={styles.bottomBanner}><View style={{ flex: 1 }}><Text style={styles.bottomTitle}>Tìm món đồ hợp với nhà bạn</Text><Text style={styles.bottomText}>Khám phá tất cả sản phẩm</Text></View><MaterialIcons name="arrow-circle-right" size={30} color={shop.primary} /></Pressable></Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, action, href }: { title: string; action: string; href: '/products' }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Link href={href} style={styles.sectionAction}>{action}</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: shop.background },
  content: { paddingHorizontal: 20, paddingBottom: 28, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 18, paddingBottom: 22 },
  eyebrow: { color: shop.ink, fontSize: 18, fontWeight: '900', letterSpacing: 1.4 },
  heading: { color: shop.muted, fontSize: 11, marginTop: 6 },
  iconButton: { width: 46, height: 46, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: shop.border, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -3, top: -3, minWidth: 20, height: 20, borderRadius: 15, backgroundColor: shop.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: shop.background },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  searchBar: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: shop.border, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, marginBottom: 20 },
  searchText: { color: shop.muted, fontSize: 13, flex: 1 },
  searchArrow: { backgroundColor: shop.soft, width: 32, height: 32, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: shop.ink, minHeight: 255, borderRadius: 28, padding: 24, overflow: 'hidden' },
  heroCircle: { position: 'absolute', right: -90, bottom: -65, width: 260, height: 260, borderRadius: 130, backgroundColor: '#2C5140' },
  heroCopy: { width: '84%', zIndex: 1 },
  heroKicker: { color: shop.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: '#fff', fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8, marginTop: 14 },
  heroText: { color: '#D2DFD1', fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 220 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: shop.accent, paddingHorizontal: 16, minHeight: 43, borderRadius: 22, marginTop: 20 },
  heroButtonText: { color: shop.ink, fontSize: 12, fontWeight: '800' },
  heroIcon: { position: 'absolute', right: -18, bottom: 24, transform: [{ rotate: '-12deg' }], opacity: 0.35 },
  promise: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 },
  promiseText: { color: shop.muted, fontSize: 10, flexShrink: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 16 },
  sectionTitle: { color: shop.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  sectionAction: { color: shop.primary, fontSize: 11, fontWeight: '700', paddingVertical: 8 },
  categoryRow: { gap: 16, paddingBottom: 2 },
  category: { alignItems: 'center', width: 72 },
  categoryIcon: { width: 66, height: 66, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { color: shop.ink, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  productRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCell: { width: '48%', flexGrow: 1, maxWidth: '49%' },
  bottomBanner: { backgroundColor: shop.soft, padding: 20, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  bottomTitle: { color: shop.ink, fontSize: 14, fontWeight: '700' },
  bottomText: { color: shop.muted, fontSize: 12, marginTop: 5 },
});
