import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

export default function ProductsScreen() {
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

  const refresh = () => {
    setRefreshing(true);
    loadProducts(search);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>CỬA HÀNG</Text>
        <Text style={styles.title}>Sản phẩm</Text>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={21} color="#64748b" />
          <TextInput
            placeholder="Tìm sản phẩm, mã hoặc danh mục"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
          {search ? <Pressable onPress={() => setSearch('')}><MaterialIcons name="close" size={20} color="#64748b" /></Pressable> : null}
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
          renderItem={({ item, index }) => (
            <View style={[styles.chip, index === 0 && styles.chipActive]}>
              <Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{item}</Text>
            </View>
          )}
        />

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#E76F51" /><Text style={styles.muted}>Đang tải sản phẩm...</Text></View>
        ) : error ? (
          <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable style={styles.retry} onPress={() => loadProducts(search, true)}><Text style={styles.retryText}>Thử lại</Text></Pressable></View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => String(item.ma_san_pham)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={products.length ? styles.list : styles.emptyList}
            ListEmptyComponent={<Text style={styles.muted}>Không có sản phẩm phù hợp</Text>}
            renderItem={({ item }) => (
              <Link href={{ pathname: '/product/[id]', params: { id: String(item.ma_san_pham) } }} asChild>
                <Pressable style={styles.card}>
                  <Image source={{ uri: item.hinh_anh || 'https://via.placeholder.com/400x300.png?text=No+Image' }} style={styles.image} />
                  <Text style={styles.category}>{item.ten_danh_muc || 'Danh mục'}</Text>
                  <Text numberOfLines={2} style={styles.name}>{item.ten_san_pham}</Text>
                  <Text style={styles.stock}>{Number(item.so_luong) > 0 ? `Còn ${item.so_luong}` : 'Hết hàng'}</Text>
                  <Text style={styles.price}>{formatCurrency(item.gia_ban)}</Text>
                </Pressable>
              </Link>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#152238', fontSize: 30, fontWeight: '800', marginTop: 4, marginBottom: 14 },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12 },
  search: { flex: 1, color: '#152238', fontSize: 14 },
  categories: { gap: 8, paddingVertical: 14 },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#152238', borderColor: '#152238' },
  chipText: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  row: { gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#eef2f7' },
  image: { width: '100%', aspectRatio: 1.1, borderRadius: 10, marginBottom: 10, backgroundColor: '#eef2f7' },
  category: { color: '#E76F51', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  name: { color: '#152238', fontSize: 14, fontWeight: '800', minHeight: 38, marginTop: 4 },
  stock: { color: '#64748b', fontSize: 12, marginTop: 5 },
  price: { color: '#E76F51', fontSize: 16, fontWeight: '800', marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#64748b', fontSize: 14 },
  error: { color: '#dc2626', fontSize: 14 },
  retry: { backgroundColor: '#152238', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
});
