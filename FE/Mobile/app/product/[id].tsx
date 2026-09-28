import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, LoadingState, ProductImage } from '@/components/shop-ui';
import { cartService } from '../../services/cart.service';
import { productService } from '../../services/product.service';
import type { GroupedSpecification, Product, ProductImage as IProductImage } from '../../types';
import { formatCurrency, getApiMessage } from '../../utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id || isNaN(Number(id))) {
        setLoading(false);
        return;
      }
      try {
        const response = await productService.getProductById(Number(id));
        const data = response?.data;
        if (data) {
          setProduct(data);

          // Determine primary image
          const imgList = data.images || data.danh_sach_hinh_anh || [];
          const primary = imgList.find((img: IProductImage) => img.la_anh_chinh) || imgList[0];
          setSelectedImageUri(primary?.duong_dan || data.hinh_anh || null);
        }
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

  const imagesList = useMemo(() => {
    if (!product) return [];
    const list = product.images || product.danh_sach_hinh_anh || [];
    if (list.length > 0) return list;
    if (product.hinh_anh) {
      return [{ duong_dan: product.hinh_anh, la_anh_chinh: true, ma_hinh_anh: 0 }];
    }
    return [];
  }, [product]);

  const groupedSpecs: GroupedSpecification[] = useMemo(() => {
    if (!product) return [];
    if (product.specifications && product.specifications.length > 0) {
      return product.specifications;
    }
    if (product.thong_so_ky_thuat && product.thong_so_ky_thuat.length > 0) {
      const map = new Map<string, any[]>();
      for (const s of product.thong_so_ky_thuat) {
        const groupName = s.ten_nhom || 'Thông số khác';
        if (!map.has(groupName)) map.set(groupName, []);
        let val = s.gia_tri;
        if (val == null) {
          if (s.gia_tri_so != null) val = String(s.gia_tri_so);
          else if (s.gia_tri_bool != null) val = s.gia_tri_bool ? 'Có' : 'Không';
          else val = '';
        }
        map.get(groupName)!.push({
          ma_thong_so: s.ma_thong_so,
          name: s.ten_thong_so || '',
          value: val,
          unit: s.don_vi || null,
        });
      }
      return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
    }
    return [];
  }, [product]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Đang tải sản phẩm..." />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="inventory-2"
          title="Không tìm thấy sản phẩm"
          action="Xem sản phẩm khác"
          onAction={() => router.replace('/products')}
        />
      </SafeAreaView>
    );
  }

  const inStock = Number(product.so_luong) > 0;
  const currentImageUri = selectedImageUri || product.hinh_anh;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Product Image */}
        <View style={styles.imageCard}>
          <ProductImage uri={currentImageUri} style={styles.image} />
          <View style={styles.imageLabel}>
            <MaterialIcons name="bolt" size={14} color="#176B52" />
            <Text style={styles.imageLabelText}>ELECTRIC SHOP</Text>
          </View>
        </View>

        {/* Thumbnail Gallery (if more than 1 image) */}
        {imagesList.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {imagesList.map((img, idx) => {
              const isSelected = img.duong_dan === currentImageUri;
              return (
                <Pressable
                  key={img.ma_hinh_anh || idx}
                  style={[styles.thumbnailWrap, isSelected && styles.thumbnailActive]}
                  onPress={() => setSelectedImageUri(img.duong_dan)}
                >
                  <Image source={{ uri: img.duong_dan }} style={styles.thumbnail} resizeMode="cover" />
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.category}>{product.ten_danh_muc || product.ten_thuong_hieu || 'Sản phẩm'}</Text>
        <Text style={styles.title}>{product.ten_san_pham}</Text>
        <Text style={styles.price}>{formatCurrency(product.gia_ban)}</Text>
        <View style={styles.stockLine}>
          <MaterialIcons name={inStock ? 'check-circle' : 'error'} size={18} color={inStock ? '#176B52' : '#dc2626'} />
          <Text style={[styles.stock, !inStock && styles.outStock]}>
            {inStock ? `Còn ${product.so_luong} sản phẩm` : 'Hết hàng'}
          </Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Về sản phẩm này</Text>
        <Text style={styles.description}>{product.mo_ta || 'Sản phẩm chưa có mô tả chi tiết.'}</Text>

        {/* Technical Specifications by Group */}
        {groupedSpecs.length > 0 && (
          <View style={styles.specsContainer}>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            {groupedSpecs.map(group => (
              <View key={group.group} style={styles.specGroupCard}>
                <Text style={styles.specGroupTitle}>{group.group.toUpperCase()}</Text>
                {group.items.map((item, itemIdx) => {
                  const valStr = String(item.value ?? '');
                  const unitStr = item.unit && !valStr.includes(item.unit) ? ` ${item.unit}` : '';
                  return (
                    <View key={item.ma_thong_so || `${item.name}-${itemIdx}`} style={styles.specRow}>
                      <Text style={styles.specLabel}>{item.name}</Text>
                      <Text style={styles.specValue}>
                        {valStr}{unitStr}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Quantity selector */}
        <View style={styles.quantityCard}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.quantityRow}>
            <Pressable
              accessibilityLabel="Giảm số lượng"
              style={styles.qtyButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <MaterialIcons name="remove" size={18} color="#183C35" />
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable
              accessibilityLabel="Tăng số lượng"
              style={styles.qtyButton}
              onPress={() => setQuantity(Math.min(Number(product.so_luong || 1), quantity + 1))}
            >
              <MaterialIcons name="add" size={18} color="#183C35" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Footer Checkout */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerLabel}>Tạm tính · {quantity} sản phẩm</Text>
          <Text style={styles.footerPrice}>{formatCurrency(Number(product.gia_ban) * quantity)}</Text>
        </View>
        <Pressable
          style={[styles.addButton, (!inStock || adding) && styles.disabled]}
          onPress={handleAddToCart}
          disabled={!inStock || adding}
        >
          <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
          <Text style={styles.addText}>{adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageCard: { borderRadius: 28, backgroundColor: '#EEF2E9', overflow: 'hidden', marginBottom: 14 },
  imageLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginBottom: 16 },
  imageLabelText: { fontSize: 9, letterSpacing: 2, color: '#6D7D76', fontWeight: '800' },
  galleryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  thumbnailWrap: { width: 62, height: 62, borderRadius: 14, borderWidth: 2, borderColor: '#E3E9E1', overflow: 'hidden', padding: 2, backgroundColor: '#fff' },
  thumbnailActive: { borderColor: '#176B52' },
  thumbnail: { width: '100%', height: '100%', borderRadius: 10 },
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
  specsContainer: { marginTop: 4 },
  specGroupCard: { marginTop: 14, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#EAF0E7' },
  specGroupTitle: { fontSize: 11, fontWeight: '800', color: '#176B52', letterSpacing: 1, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4EE', paddingBottom: 6 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F7FAF5' },
  specLabel: { color: '#6D7D76', fontSize: 13, flex: 1 },
  specValue: { color: '#183C35', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  quantityCard: { marginTop: 20, backgroundColor: '#fff', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#EAF0E7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { width: 44, height: 44, borderRadius: 9, backgroundColor: '#EDF2E9', alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#183C35', fontSize: 16, minWidth: 24, textAlign: 'center', fontWeight: '800' },
  footer: { padding: 20, width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#fffffff2', borderTopWidth: 1, borderTopColor: '#E3E9E1' },
  addButton: { height: 52, borderRadius: 16, backgroundColor: '#176B52', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabled: { opacity: 0.6 },
  addText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
