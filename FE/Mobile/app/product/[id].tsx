import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartService } from '../../services/cart.service';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { formatCurrency, getApiMessage } from '../../utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await productService.getProductById(Number(id));
        setProduct(response.data);
      } catch (error) {
        Alert.alert('Lỗi', getApiMessage(error, 'Không thể tải sản phẩm'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await cartService.addToCart(product.ma_san_pham, quantity);
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng', [
        { text: 'Tiếp tục mua' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
      ]);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        router.replace('/(auth)/login' as any);
      } else {
        Alert.alert('Lỗi', getApiMessage(error, 'Không thể thêm vào giỏ hàng'));
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color="#E76F51" /><Text style={styles.muted}>Đang tải sản phẩm...</Text></View></SafeAreaView>;
  }

  if (!product) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.muted}>Không tìm thấy sản phẩm</Text></View></SafeAreaView>;
  }

  const inStock = Number(product.so_luong) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: product.hinh_anh || 'https://via.placeholder.com/600x420.png?text=No+Image' }} style={styles.image} />
        <Text style={styles.category}>{product.ten_danh_muc || product.ten_thuong_hieu || 'Sản phẩm'}</Text>
        <Text style={styles.title}>{product.ten_san_pham}</Text>
        <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
        <View style={styles.stockLine}>
          <MaterialIcons name={inStock ? 'check-circle' : 'error'} size={18} color={inStock ? '#1A8A72' : '#dc2626'} />
          <Text style={[styles.stock, !inStock && styles.outStock]}>{inStock ? `Còn ${product.so_luong} sản phẩm` : 'Hết hàng'}</Text>
        </View>
        <Text style={styles.sectionTitle}>Mô tả</Text>
        <Text style={styles.description}>{product.mo_ta || 'Sản phẩm chưa có mô tả chi tiết.'}</Text>

        <View style={styles.quantityCard}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityRow}>
            <Pressable style={styles.qtyButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}><MaterialIcons name="remove" size={18} color="#152238" /></Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable style={styles.qtyButton} onPress={() => setQuantity(Math.min(Number(product.so_luong || 1), quantity + 1))}><MaterialIcons name="add" size={18} color="#152238" /></Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.addButton, (!inStock || adding) && styles.disabled]} onPress={handleAddToCart} disabled={!inStock || adding}>
          <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
          <Text style={styles.addText}>{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { color: '#64748b' },
  image: { width: '100%', aspectRatio: 1.25, borderRadius: 18, backgroundColor: '#eef2f7', marginBottom: 18 },
  category: { color: '#E76F51', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#152238', fontSize: 25, lineHeight: 31, fontWeight: '800', marginTop: 7 },
  price: { color: '#E76F51', fontSize: 24, fontWeight: '800', marginTop: 10 },
  stockLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  stock: { color: '#1A8A72', fontSize: 13, fontWeight: '700' },
  outStock: { color: '#dc2626' },
  sectionTitle: { color: '#152238', fontSize: 16, fontWeight: '800' },
  description: { color: '#475569', fontSize: 14, lineHeight: 22, marginTop: 8 },
  quantityCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#eef2f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#152238', fontSize: 16, minWidth: 24, textAlign: 'center', fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: '#fffffff2', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  addButton: { height: 52, borderRadius: 11, backgroundColor: '#E76F51', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.6 },
  addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
