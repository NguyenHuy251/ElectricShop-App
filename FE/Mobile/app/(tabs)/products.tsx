import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';
import { EmptyState, LoadingState, ProductCard, ScreenHeading } from '@/components/shop-ui';
import { shop } from '@/constants/shop-theme';
import { getApiMessage } from '@/utils/format';

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
  const [categoryList,setCategoryList]=useState<{ma_danh_muc:number;ten_danh_muc:string}[]>([]);
  const [brands,setBrands]=useState<{ma_thuong_hieu:number;ten_thuong_hieu:string}[]>([]);
  const [brand,setBrand]=useState<number>();
  const [min,setMin]=useState(''), [max,setMax]=useState('');
  const [sort,setSort]=useState('newest');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [page,setPage]=useState(0), [totalPages,setTotalPages]=useState(0), [total,setTotal]=useState(0);
  const [more,setMore]=useState(false);
  const generation=useRef(0),busy=useRef(false);
  useEffect(()=>{
    let active=true;
    void Promise.all([api.get('/danh-muc'),api.get('/thuong-hieu')]).then(([c,b])=>{if(active){setCategoryList(c.data.data || []);setBrands(b.data.data || []);}}).catch(err=>{if(active)setError(getApiMessage(err,'Chưa tải được bộ lọc.'));});
    return ()=>{active=false;};
  },[]);

  const loadProducts = useCallback(async (nextSearch = search, showSpinner = false, nextPage = 1) => {
    if(nextPage>1 && busy.current)return;
    const request=nextPage===1 ? ++generation.current : generation.current;
    busy.current=true;
    if(nextPage>1)setMore(true);
    if (showSpinner) setLoading(true);
    setError('');
    try {
      if((min && !/^\d+$/.test(min)) || (max && !/^\d+$/.test(max)) || (min && max && Number(min)>Number(max))) {setError('Nhập khoảng giá hợp lệ.');return;}
      const categoryId=categoryList.find(c=>c.ten_danh_muc===selectedCategory)?.ma_danh_muc;
      const result = await productService.getProducts({ search: nextSearch, limit: 20, page:nextPage, sort, ma_danh_muc:categoryId, ma_thuong_hieu:brand, min_price:min || undefined, max_price:max || undefined });
      if(request!==generation.current)return;
      setProducts(current=>nextPage===1 ? result.data || [] : [...current,...(result.data || [])]);
      setPage(nextPage);setTotalPages(result.pagination?.totalPages || 0);setTotal(result.pagination?.total || 0);
    } catch (error) {
      if(request===generation.current)setError(getApiMessage(error, 'Không thể tải danh sách sản phẩm'));
    } finally {
      if(request===generation.current){setLoading(false);setRefreshing(false);setMore(false);busy.current=false;}
    }
  }, [search,sort,brand,min,max,categoryList,selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(search, true), 350);
    return () => {clearTimeout(timer);generation.current++;busy.current=false;};
  }, [loadProducts, search]);

  const categories = ['Tất cả',...categoryList.map(c=>c.ten_danh_muc)];
  const activeFilterCount = Number(selectedCategory !== 'Tất cả') + Number(Boolean(brand)) + Number(Boolean(min || max)) + Number(sort !== 'newest');

  const visibleProducts = products;

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filtersVisible ? 'Ẩn bộ lọc sản phẩm' : 'Hiện bộ lọc sản phẩm'}
          accessibilityState={{ expanded: filtersVisible }}
          onPress={() => setFiltersVisible(current => !current)}
          style={styles.filterToggle}
        >
          <MaterialIcons name="filter-list" size={20} color={shop.primary} />
          <Text style={styles.filterToggleText}>{filtersVisible ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</Text>
          {activeFilterCount > 0 ? <Text style={styles.filterCount}>{activeFilterCount} đang áp dụng</Text> : null}
          <MaterialIcons name={filtersVisible ? 'expand-less' : 'expand-more'} size={22} color={shop.primary} />
        </Pressable>

        {filtersVisible ? <View>
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

        <ScrollView horizontal style={{flexGrow:0,flexShrink:0}} contentContainerStyle={{gap:8,paddingBottom:8}}>{[{ma_thuong_hieu:0,ten_thuong_hieu:'Mọi thương hiệu'},...brands].map(b=><Pressable key={b.ma_thuong_hieu} onPress={()=>setBrand(b.ma_thuong_hieu || undefined)} style={[styles.chip,(brand || 0)===b.ma_thuong_hieu && styles.chipActive]}><Text style={[styles.chipText,(brand || 0)===b.ma_thuong_hieu && styles.chipTextActive]}>{b.ten_thuong_hieu}</Text></Pressable>)}</ScrollView>
        <View style={styles.row}><TextInput accessibilityLabel="Giá từ" placeholder="Giá từ (đ)" keyboardType="numeric" value={min} onChangeText={setMin} style={[styles.searchBox,{flex:1,padding:10,height:40}]}/><TextInput accessibilityLabel="Giá đến" placeholder="Giá đến (đ)" keyboardType="numeric" value={max} onChangeText={setMax} style={[styles.searchBox,{flex:1,padding:10,height:40}]}/></View>
        <ScrollView horizontal style={{flexGrow:0,flexShrink:0}} contentContainerStyle={styles.categories}>{[['newest','Mới nhất'],['price_asc','Giá tăng'],['price_desc','Giá giảm'],['bestseller','Bán chạy']].map(([value,label])=><Pressable key={value} onPress={()=>setSort(value)} style={[styles.chip,sort===value && styles.chipActive]}><Text style={[styles.chipText,sort===value && styles.chipTextActive]}>{label}</Text></Pressable>)}</ScrollView>
        </View> : null}
        {loading ? (
          <LoadingState message="Đang tải sản phẩm..." />
        ) : error && !products.length ? (
          <EmptyState icon="wifi-off" title="Kết nối bị gián đoạn" message={error} action="Thử lại" onAction={() => loadProducts(search, true)} />
        ) : (
          <FlatList
            data={visibleProducts}
            onEndReached={()=>{if(page<totalPages && !error)void loadProducts(search,false,page+1);}}
            onEndReachedThreshold={0.3}
            ListFooterComponent={error ? <EmptyState icon="wifi-off" title="Chưa tải được trang tiếp theo" message={error} action="Thử lại" onAction={()=>void loadProducts(search,false,page+1)}/> : more ? <LoadingState message="Đang tải thêm..."/> : null}
            keyExtractor={(item) => String(item.ma_san_pham)}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            contentContainerStyle={visibleProducts.length ? styles.list : styles.emptyList}
            ListHeaderComponent={visibleProducts.length ? <Text style={styles.resultCount}>{total} sản phẩm dành cho bạn</Text> : null}
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
  filterToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  filterToggleText: { color: shop.primary, fontSize: 13, fontWeight: '700', flex: 1 },
  filterCount: { color: shop.muted, fontSize: 12 },
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
