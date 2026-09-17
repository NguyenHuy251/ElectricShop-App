import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartService } from '../../services/cart.service';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

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

  const loadHome = useCallback(async () => {
    try {
      const response = await productService.getProducts({ limit: 4 });
      setProducts(response.data || []);
    } catch {
      setProducts([]);
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
            <Text style={styles.eyebrow}>ĐIỆN GIA DỤNG</Text>
            <Text style={styles.heading}>Mua sắm tiện hơn.</Text>
          </View>
          <Link href="/cart" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialIcons name="shopping-bag" size={23} color="#152238" />
              {cartCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text></View> : null}
            </Pressable>
          </Link>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>SẢN PHẨM MỚI</Text>
            <Text style={styles.heroTitle}>Nâng cấp không gian sống.</Text>
            <Text style={styles.heroText}>Thiết bị chính hãng, dễ chọn, giao hàng nhanh.</Text>
            <Link href="/products" asChild>
              <Pressable style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Xem sản phẩm</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </Link>
          </View>
          <MaterialIcons name="blender" size={100} color="#B5D4E9" style={styles.heroIcon} />
        </View>

        <SectionHeader title="Danh mục" action="Xem tất cả" href="/products" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {fallbackCategories.map((category) => (
            <Link href="/products" key={category.label} asChild>
              <Pressable style={styles.category}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><MaterialIcons name={category.icon} size={26} color="#152238" /></View>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>

        <SectionHeader title="Sản phẩm nổi bật" action="Xem thêm" href="/products" />
        {loading ? (
          <View style={styles.loading}><ActivityIndicator color="#E76F51" /></View>
        ) : (
          <View style={styles.productRow}>
            {products.slice(0, 2).map((product) => (
              <Link href={{ pathname: '/product/[id]', params: { id: String(product.ma_san_pham) } }} key={product.ma_san_pham} asChild>
                <Pressable style={styles.productCard}>
                  <Image source={{ uri: product.hinh_anh || 'https://via.placeholder.com/300x220.png?text=No+Image' }} style={styles.productImage} />
                  <Text numberOfLines={2} style={styles.productName}>{product.ten_san_pham}</Text>
                  <Text style={styles.productDetail}>{product.ten_danh_muc || product.ten_thuong_hieu || 'Sản phẩm'}</Text>
                  <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 22 },
  eyebrow: { color: '#7A8798', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  heading: { color: '#152238', fontSize: 25, fontWeight: '800', marginTop: 5 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#152238', shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  badge: { position: 'absolute', right: -1, top: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  hero: { backgroundColor: '#152238', minHeight: 188, borderRadius: 20, padding: 22, overflow: 'hidden', flexDirection: 'row' },
  heroCopy: { width: '76%', zIndex: 1 },
  heroKicker: { color: '#A8DADC', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: '#FFF', fontSize: 26, lineHeight: 30, fontWeight: '800', marginTop: 8 },
  heroText: { color: '#C9D2DF', fontSize: 13, lineHeight: 19, marginTop: 8 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#E76F51', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 8, marginTop: 15 },
  heroButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  heroIcon: { position: 'absolute', right: -7, bottom: 18, transform: [{ rotate: '-15deg' }] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  sectionTitle: { color: '#152238', fontSize: 18, fontWeight: '800' },
  sectionAction: { color: '#E76F51', fontSize: 13, fontWeight: '700' },
  categoryRow: { gap: 14, paddingRight: 20 },
  category: { alignItems: 'center', width: 76 },
  categoryIcon: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { color: '#536174', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  loading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  productRow: { flexDirection: 'row', gap: 14 },
  productCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#eef2f7' },
  productImage: { height: 126, borderRadius: 12, backgroundColor: '#eef2f7', marginBottom: 11 },
  productName: { color: '#152238', fontSize: 13, fontWeight: '800', minHeight: 36 },
  productDetail: { color: '#8490A0', fontSize: 11, marginTop: 4 },
  price: { color: '#E76F51', fontSize: 15, fontWeight: '800', marginTop: 9 },
});
