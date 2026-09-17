import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';
import { cartService } from '../../services/cart.service';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const response = await productService.getProductById(Number(id));
      setProduct(response.data);
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await cartService.addToCart(Number(id), 1);
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  if (!product) return <SafeAreaView style={styles.safe}><View style={styles.container}><Text>Đang tải...</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={{ uri: product.hinh_anh || 'https://via.placeholder.com/300' }} style={styles.image} />
        <Text style={styles.title}>{product.ten_san_pham}</Text>
        <Text style={styles.price}>{Number(product.gia_ban).toLocaleString()}đ</Text>
        <Text style={styles.meta}>{product.mo_ta || 'Không có mô tả'}</Text>
        <Button title="Thêm vào giỏ hàng" onPress={handleAddToCart} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, padding: 16 },
  image: { width: '100%', height: 260, borderRadius: 18, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  price: { fontSize: 22, color: '#d97706', fontWeight: '800', marginBottom: 12 },
  meta: { fontSize: 14, color: '#475569', marginBottom: 20 },
});
