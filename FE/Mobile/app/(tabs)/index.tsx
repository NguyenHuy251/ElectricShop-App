import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = [
  { label: 'Nhà bếp', icon: 'kitchen' as const, color: '#E8F2FF' },
  { label: 'Vệ sinh', icon: 'local-laundry-service' as const, color: '#FFF0E7' },
  { label: 'Phòng khách', icon: 'weekend' as const, color: '#F0ECFF' },
  { label: 'Chăm sóc', icon: 'health-and-safety' as const, color: '#E5F7EF' },
];

const products = [
  { name: 'Nồi chiên không dầu Pro 5L', detail: 'Nấu ăn lành mạnh, ít dầu mỡ', price: '2.290.000đ', icon: 'outdoor-grill' as const, color: '#FFE5D3' },
  { name: 'Máy lọc không khí thông minh', detail: 'Không khí trong lành mỗi ngày', price: '3.290.000đ', icon: 'air' as const, color: '#DDF3F3' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.eyebrow}>THỨ BẢY, 17 THÁNG 9</Text>
            <Text style={styles.heading}>Chào buổi sáng, Alex</Text>
          </View>
          <Link href="/cart" style={styles.cartButton}>
            <MaterialIcons name="shopping-bag" size={22} color="#152238" />
            <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
          </Link>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.heroTag}><MaterialIcons name="auto-awesome" size={13} color="#152238" /><Text style={styles.heroTagText}>BỘ SƯU TẬP MỚI</Text></View>
            <Text style={styles.heroTitle}>Không gian sống,{`\n`}đúng gu của bạn.</Text>
            <Text style={styles.heroText}>Thiết bị thông minh, thiết kế tinh tế cho cuộc sống tiện nghi hơn.</Text>
            <Link href="/products" style={styles.heroButton}><Text style={styles.heroButtonText}>Khám phá ngay</Text><MaterialIcons name="arrow-forward" size={17} color="#FFF" /></Link>
          </View>
          <View style={styles.heroOrb}><MaterialIcons name="blender" size={92} color="#A8DADC" /></View>
        </View>

        <View style={styles.trustRow}>
          <TrustItem icon="local-shipping" title="Giao nhanh" text="Toàn quốc" />
          <TrustItem icon="verified-user" title="Chính hãng" text="100% uy tín" />
          <TrustItem icon="support-agent" title="Hỗ trợ 24/7" text="Luôn sẵn sàng" />
        </View>

        <SectionHeader title="Danh mục sản phẩm" action="Xem tất cả" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => <Link href="/products" key={category.label} style={styles.category}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><MaterialIcons name={category.icon} size={25} color="#152238" /></View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
          </Link>)}
        </ScrollView>

        <SectionHeader title="Được yêu thích" action="Xem tất cả" />
        <View style={styles.productRow}>
          {products.map((product) => <Link href="/products" key={product.name} style={styles.productCard}>
            <View style={[styles.productImage, { backgroundColor: product.color }]}><View style={styles.productIconBadge}><MaterialIcons name="favorite-border" size={15} color="#152238" /></View><MaterialIcons name={product.icon} size={70} color="#152238" /></View>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productDetail} numberOfLines={1}>{product.detail}</Text>
            <View style={styles.productFooter}><Text style={styles.price}>{product.price}</Text><MaterialIcons name="arrow-outward" size={16} color="#E76F51" /></View>
          </Link>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrustItem({ icon, title, text }: { icon: 'local-shipping' | 'verified-user' | 'support-agent'; title: string; text: string }) {
  return <View style={styles.trustItem}><MaterialIcons name={icon} size={19} color="#1A8A72" /><View><Text style={styles.trustTitle}>{title}</Text><Text style={styles.trustText}>{text}</Text></View></View>;
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Link href="/products" style={styles.sectionAction}>{action}</Link></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FB' },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 20 },
  greeting: { flex: 1 },
  eyebrow: { color: '#E76F51', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heading: { color: '#152238', fontSize: 25, fontWeight: '800', marginTop: 5 },
  cartButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#152238', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  badge: { position: 'absolute', right: -2, top: -3, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F6F8FB' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  hero: { minHeight: 238, borderRadius: 24, padding: 21, backgroundColor: '#152238', overflow: 'hidden' },
  heroCopy: { width: '78%', zIndex: 1 },
  heroTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#A8DADC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  heroTagText: { color: '#152238', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '800', marginTop: 16 },
  heroText: { color: '#C9D2DF', fontSize: 13, lineHeight: 19, marginTop: 10 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#E76F51', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 9, marginTop: 17 },
  heroButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  heroOrb: { position: 'absolute', right: -23, bottom: 15, width: 145, height: 145, borderRadius: 73, backgroundColor: '#20334E', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginTop: 14, shadowColor: '#152238', shadowOpacity: 0.04, shadowRadius: 9, elevation: 1 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  trustTitle: { color: '#152238', fontSize: 10, fontWeight: '800' },
  trustText: { color: '#8A96A5', fontSize: 9, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  sectionTitle: { color: '#152238', fontSize: 18, fontWeight: '800' },
  sectionAction: { color: '#E76F51', fontSize: 12, fontWeight: '800' },
  categoryRow: { gap: 12, paddingRight: 20 },
  category: { alignItems: 'center', width: 74 },
  categoryIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { color: '#536174', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  productRow: { flexDirection: 'row', gap: 12 },
  productCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 10, shadowColor: '#152238', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  productImage: { height: 130, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  productIconBadge: { position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFFAA', alignItems: 'center', justifyContent: 'center' },
  productName: { color: '#152238', fontSize: 13, lineHeight: 18, fontWeight: '800', marginTop: 10, minHeight: 36 },
  productDetail: { color: '#8A96A5', fontSize: 10, marginTop: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 },
  price: { color: '#E76F51', fontSize: 14, fontWeight: '900' },
});
