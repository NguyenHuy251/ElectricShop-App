import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
        <Text style={styles.kicker}>KHÁM PHÁ</Text>
        <View style={styles.headingRow}><Text style={styles.title}>Tìm sản phẩm cần thiết</Text><MaterialIcons name="tune" size={23} color="#152238" /></View>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={21} color="#8B97A5" />
          <TextInput
          placeholder="Tìm sản phẩm..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          />
        </View>
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.ma_san_pham)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/product/[id]', params: { id: String(item.ma_san_pham) } } as any} asChild>
              <View style={styles.card}>
                <View style={styles.imageWrap}><Image source={{ uri: item.hinh_anh || 'https://via.placeholder.com/200' }} style={styles.image} /><View style={styles.heart}><MaterialIcons name="favorite-border" size={16} color="#152238" /></View></View>
                <Text style={styles.name}>{item.ten_san_pham}</Text>
                <Text style={styles.meta}>{item.ten_danh_muc || 'Danh mục'}</Text>
                <View style={styles.rating}><MaterialIcons name="star" size={15} color="#F2B134" /><Text style={styles.meta}>4.8</Text><Text style={styles.meta}> · 32 đánh giá</Text></View>
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 27, fontWeight: '800', color: '#152238', marginTop: 5 },
  searchWrap: { height: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E6EAF0', marginBottom: 16 },
  search: { flex: 1, padding: 0, marginLeft: 8, color: '#152238', fontSize: 14 },
  list: { paddingBottom: 24 },
  row: { gap: 12 },
  card: { flex: 1, maxWidth: '50%', backgroundColor: '#FFF', borderRadius: 14, padding: 10, marginBottom: 12, shadowColor: '#152238', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 10 },
  heart: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 4, color: '#152238' },
  meta: { color: '#64748b', fontSize: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  price: { marginTop: 8, color: '#E76F51', fontWeight: '800', fontSize: 16 },
});
