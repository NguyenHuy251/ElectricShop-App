import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = [
  { label: 'Kitchen', icon: 'kitchen' as const, color: '#EAF5FF' },
  { label: 'Cleaning', icon: 'local-laundry-service' as const, color: '#FFF2E8' },
  { label: 'Living room', icon: 'weekend' as const, color: '#F2EEFF' },
  { label: 'Personal care', icon: 'health-and-safety' as const, color: '#EAF8F0' },
];

const products = [
  { name: 'Air Fryer Pro 5L', detail: 'Healthy cooking, less oil', price: '$89.90', icon: 'outdoor-grill' as const, color: '#FFE8D5' },
  { name: 'Smart Air Purifier', detail: 'Fresh air for every room', price: '$129.00', icon: 'air' as const, color: '#DFF3F4' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>GOOD MORNING, ALEX</Text><Text style={styles.heading}>Make home feel better.</Text></View>
          <Link href="/cart" style={styles.iconButton}><MaterialIcons name="shopping-bag" size={23} color="#152238" /><View style={styles.badge}><Text style={styles.badgeText}>2</Text></View></Link>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.heroKicker}>WEEKEND ESSENTIALS</Text><Text style={styles.heroTitle}>Upgrade your everyday.</Text><Text style={styles.heroText}>Smart appliances, thoughtful design, better living.</Text><Link href="/explore" style={styles.heroButton}><Text style={styles.heroButtonText}>Shop collection</Text><MaterialIcons name="arrow-forward" size={18} color="#fff" /></Link></View>
          <MaterialIcons name="blender" size={100} color="#B5D4E9" style={styles.heroIcon} />
        </View>
        <SectionHeader title="Shop by category" action="See all" href="/explore" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{categories.map((category) => <Link href="/explore" key={category.label} style={styles.category}><View style={[styles.categoryIcon, { backgroundColor: category.color }]}><MaterialIcons name={category.icon} size={26} color="#152238" /></View><Text style={styles.categoryLabel}>{category.label}</Text></Link>)}</ScrollView>
        <SectionHeader title="Popular right now" action="View all" href="/explore" />
        <View style={styles.productRow}>{products.map((product) => <Link href="/explore" key={product.name} style={styles.productCard}><View style={[styles.productImage, { backgroundColor: product.color }]}><MaterialIcons name={product.icon} size={72} color="#152238" /></View><Text style={styles.productName}>{product.name}</Text><Text style={styles.productDetail}>{product.detail}</Text><Text style={styles.price}>{product.price}</Text></Link>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, action, href }: { title: string; action: string; href: '/explore' }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Link href={href} style={styles.sectionAction}>{action}</Link></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' }, content: { paddingHorizontal: 20, paddingBottom: 32 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 22 }, eyebrow: { color: '#7A8798', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }, heading: { color: '#152238', fontSize: 25, fontWeight: '800', marginTop: 5 }, iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#152238', shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 }, badge: { position: 'absolute', right: -1, top: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#E76F51', alignItems: 'center', justifyContent: 'center' }, badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }, hero: { backgroundColor: '#152238', minHeight: 188, borderRadius: 22, padding: 22, overflow: 'hidden', flexDirection: 'row' }, heroCopy: { width: '76%', zIndex: 1 }, heroKicker: { color: '#A8DADC', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }, heroTitle: { color: '#FFF', fontSize: 26, lineHeight: 30, fontWeight: '800', marginTop: 8 }, heroText: { color: '#C9D2DF', fontSize: 13, lineHeight: 19, marginTop: 8 }, heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#E76F51', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 8, marginTop: 15 }, heroButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' }, heroIcon: { position: 'absolute', right: -7, bottom: 18, transform: [{ rotate: '-15deg' }] }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 }, sectionTitle: { color: '#152238', fontSize: 18, fontWeight: '800' }, sectionAction: { color: '#E76F51', fontSize: 13, fontWeight: '700' }, categoryRow: { gap: 14, paddingRight: 20 }, category: { alignItems: 'center', width: 76 }, categoryIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, categoryLabel: { color: '#536174', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8 }, productRow: { flexDirection: 'row', gap: 14 }, productCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 10, shadowColor: '#152238', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }, productImage: { height: 126, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 11 }, productName: { color: '#152238', fontSize: 13, fontWeight: '800' }, productDetail: { color: '#8490A0', fontSize: 11, marginTop: 4 }, price: { color: '#E76F51', fontSize: 15, fontWeight: '800', marginTop: 9 },
});
