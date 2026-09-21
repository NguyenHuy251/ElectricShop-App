import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage } from '@/components/shop-ui';
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
    return <SafeAreaView style={styles.safe}><LoadingState message="Đang tải sản phẩm..." /></SafeAreaView>;
  }

  if (!product) {
    return <SafeAreaView style={styles.safe}><EmptyState icon="inventory-2" title="Không tìm thấy sản phẩm" action="Xem sản phẩm khác" onAction={() => router.replace('/products')} /></SafeAreaView>;
  }

  const inStock = Number(product.so_luong) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageCard}><ProductImage uri={product.hinh_anh} style={styles.image} /><View style={styles.imageLabel}><MaterialIcons name="bolt" size={14} color="#176B52" /><Text style={styles.imageLabelText}>ELECTRIC SHOP</Text></View></View>
        <Text style={styles.category}>{product.ten_danh_muc || product.ten_thuong_hieu || 'Sản phẩm'}</Text>
        <Text style={styles.title}>{product.ten_san_pham}</Text>
        <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
        <View style={styles.stockLine}>
          <MaterialIcons name={inStock ? 'check-circle' : 'error'} size={18} color={inStock ? '#176B52' : '#dc2626'} />
          <Text style={[styles.stock, !inStock && styles.outStock]}>{inStock ? `Còn ${product.so_luong} sản phẩm` : 'Hết hàng'}</Text>
        </View>
        <View style={styles.divider} /><Text style={styles.sectionTitle}>Về sản phẩm này</Text>
        <Text style={styles.description}>{product.mo_ta || 'Sản phẩm chưa có mô tả chi tiết.'}</Text>

        <View style={styles.quantityCard}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityRow}>
            <Pressable accessibilityLabel="Giảm số lượng" style={styles.qtyButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}><MaterialIcons name="remove" size={18} color="#183C35" /></Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable accessibilityLabel="Tăng số lượng" style={styles.qtyButton} onPress={() => setQuantity(Math.min(Number(product.so_luong || 1), quantity + 1))}><MaterialIcons name="add" size={18} color="#183C35" /></Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.footerTotal}><Text style={styles.footerLabel}>Tạm tính · {quantity} sản phẩm</Text><Text style={styles.footerPrice}>{formatCurrency(Number(product.gia_ban) * quantity)}</Text></View>
        <Pressable style={[styles.addButton, (!inStock || adding) && styles.disabled]} onPress={handleAddToCart} disabled={!inStock || adding}>
          <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
          <Text style={styles.addText}>{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageCard: { borderRadius: 28, backgroundColor: '#EEF2E9', overflow: 'hidden', marginBottom: 24 },
  imageLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginBottom: 16 },
  imageLabelText: { fontSize: 9, letterSpacing: 2, color: '#6D7D76', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#E3E9E1', marginVertical: 24 },
  footerTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  footerLabel: { color: '#6D7D76', fontSize: 12 },
  footerPrice: { color: '#176B52', fontSize: 20, fontWeight: '800' },
  safe: { flex: 1, backgroundColor: '#F6F7F2' },
  content: { padding: 20, paddingBottom: 28, width: '100%', maxWidth: 760, alignSelf: 'center' },
  image: { width: '100%', aspectRatio: 1.15, backgroundColor: '#EEF2E9' },
  category: { color: '#176B52', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#183C35', fontSize: 25, lineHeight: 31, fontWeight: '800', marginTop: 7 },
  price: { color: '#176B52', fontSize: 24, fontWeight: '800', marginTop: 10 },
  stockLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  stock: { color: '#176B52', fontSize: 13, fontWeight: '700' },
  outStock: { color: '#dc2626' },
  sectionTitle: { color: '#183C35', fontSize: 16, fontWeight: '800' },
  description: { color: '#596C62', fontSize: 14, lineHeight: 22, marginTop: 8 },
  quantityCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#EAF0E7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { width: 44, height: 44, borderRadius: 9, backgroundColor: '#EDF2E9', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#183C35', fontSize: 16, minWidth: 24, textAlign: 'center', fontWeight: '800' },
  footer: { padding: 20, width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#fffffff2', borderTopWidth: 1, borderTopColor: '#E3E9E1' },
  addButton: { height: 52, borderRadius: 16, backgroundColor: '#176B52', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.6 },
  addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
