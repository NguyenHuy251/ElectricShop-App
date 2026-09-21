import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { EmptyState, LoadingState, ProductCard, ScreenHeading } from '@/components/shop-ui';
import { shop } from '@/constants/shop-theme';

export default function ProductsScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const selectedCategory = category || 'Tất cả';
  const setSelectedCategory = (value: string) => router.setParams({ category: value });
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async (nextSearch = search, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const result = await productService.getProducts({ search: nextSearch, limit: 50 });
      setProducts(result.data || []);
    } catch {
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(search, true), 350);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  const categories = useMemo(() => [
    'Tất cả',
    ...Array.from(new Set(products.map((item) => item.ten_danh_muc).filter((value): value is string => Boolean(value)))),
  ], [products]);

  const visibleProducts = products.filter(item => selectedCategory === 'Tất cả' || item.ten_danh_muc === selectedCategory);

  const refresh = () => {
    setRefreshing(true);
    loadProducts(search);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeading eyebrow="KHÁM PHÁ" title="Chọn cho tổ ấm" subtitle="Những tiện ích nhỏ, cho cuộc sống dễ dàng hơn." icon="grid-view" />
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={21} color="#6D7D76" />
          <TextInput
            placeholder="Tìm sản phẩm, mã hoặc danh mục"
            placeholderTextColor="#84938B"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          {search ? <Pressable onPress={() => setSearch('')}><MaterialIcons name="close" size={20} color="#6D7D76" /></Pressable> : null}
        </View>

        <FlatList
          horizontal
          style={{ flexGrow: 0, flexShrink: 0 }}
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedCategory(item)} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === item }} style={[styles.chip, selectedCategory === item && styles.chipActive]}>
              <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />

        {loading ? (
          <LoadingState message="Đang tải sản phẩm..." />
        ) : error ? (
          <EmptyState icon="wifi-off" title="Kết nối bị gián đoạn" message={error} action="Thử lại" onAction={() => loadProducts(search, true)} />
        ) : (
          <FlatList
            data={visibleProducts}
            keyExtractor={(item) => String(item.ma_san_pham)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={visibleProducts.length ? styles.list : styles.emptyList}
            ListHeaderComponent={visibleProducts.length ? <Text style={styles.resultCount}>{visibleProducts.length} sản phẩm dành cho bạn</Text> : null}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon="search-off" title="Chưa tìm thấy sản phẩm" message="Thử từ khóa khác hoặc xem tất cả danh mục." action="Xem tất cả" onAction={() => { setSearch(''); setSelectedCategory('Tất cả'); }} />}
            renderItem={({ item }) => <View style={styles.productCell}><ProductCard product={item} /></View>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  resultCount: { color: shop.muted, fontSize: 12, marginBottom: 16 },
  productCell: { flex: 1, maxWidth: '49%', marginBottom: 14 },
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  searchBox: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E3E9E1', paddingHorizontal: 12 },
  search: { flex: 1, color: '#183C35', fontSize: 14 },
  categories: { gap: 8, paddingVertical: 14 },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E9E1' },
  chipActive: { backgroundColor: '#183C35', borderColor: '#183C35' },
  chipText: { color: '#6D7D76', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  row: { gap: 12 },
});
