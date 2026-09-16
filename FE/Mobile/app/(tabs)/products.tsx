import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    try {
      const result = await productService.getProducts({ search, limit: 20 });
      setProducts(result.data || []);
    } catch (error) {
      console.error('Load products failed', error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Sản phẩm</Text>
        <TextInput
          placeholder="Tìm sản phẩm..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.ma_san_pham)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/product/[id]', params: { id: String(item.ma_san_pham) } } as any} asChild>
              <View style={styles.card}>
                <Image source={{ uri: item.hinh_anh || 'https://via.placeholder.com/200' }} style={styles.image} />
                <Text style={styles.name}>{item.ten_san_pham}</Text>
                <Text style={styles.meta}>{item.ten_danh_muc || 'Danh mục'}</Text>
                <Text style={styles.price}>{Number(item.gia_ban).toLocaleString()}đ</Text>
              </View>
            </Link>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  search: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 12 },
  image: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12 },
  price: { marginTop: 8, color: '#d97706', fontWeight: '800', fontSize: 16 },
});
