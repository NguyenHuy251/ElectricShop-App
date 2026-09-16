import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const filters = ['All', 'Kitchen', 'Cleaning', 'Living room'];
const products = [
  { name: 'Air Fryer Pro 5L', category: 'Kitchen', price: '$89.90', rating: '4.9', icon: 'outdoor-grill' as const, color: '#FFE8D5' },
  { name: 'Smart Air Purifier', category: 'Living room', price: '$129.00', rating: '4.8', icon: 'air' as const, color: '#DFF3F4' },
  { name: 'Steam Mop Essential', category: 'Cleaning', price: '$74.50', rating: '4.7', icon: 'cleaning-services' as const, color: '#E8E2FF' },
  { name: 'Brew Coffee Maker', category: 'Kitchen', price: '$59.00', rating: '4.9', icon: 'coffee-maker' as const, color: '#FFF0C8' },
];

export default function CatalogScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}><View><Text style={styles.kicker}>DISCOVER</Text><Text style={styles.title}>Find your essentials.</Text></View><MaterialIcons name="tune" size={23} color="#152238" /></View>
        <View style={styles.search}><MaterialIcons name="search" size={21} color="#8B97A5" /><TextInput placeholder="Search appliances" placeholderTextColor="#9AA5B4" style={styles.input} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((filter, index) => <View style={[styles.filter, index === 0 && styles.activeFilter]} key={filter}><Text style={[styles.filterText, index === 0 && styles.activeFilterText]}>{filter}</Text></View>)}</ScrollView>
        <View style={styles.resultRow}><Text style={styles.result}>24 products</Text><View style={styles.sort}><Text style={styles.sortText}>Popular</Text><MaterialIcons name="keyboard-arrow-down" size={17} color="#536174" /></View></View>
        <View style={styles.grid}>{products.map((product) => <Link href="/modal" key={product.name} style={styles.card}><View style={[styles.image, { backgroundColor: product.color }]}><View style={styles.heart}><MaterialIcons name="favorite-border" size={16} color="#152238" /></View><MaterialIcons name={product.icon} size={70} color="#152238" /></View><Text style={styles.category}>{product.category}</Text><Text style={styles.name}>{product.name}</Text><View style={styles.rating}><MaterialIcons name="star" size={15} color="#F2B134" /><Text style={styles.ratingText}>{product.rating}</Text><Text style={styles.dot}>•</Text><Text style={styles.reviews}>32 reviews</Text></View><Text style={styles.price}>{product.price}</Text></Link>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 20, paddingBottom: 30 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }, kicker: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#152238', fontSize: 27, fontWeight: '800', marginTop: 5 }, search: { height: 48, backgroundColor: '#FFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginTop: 22 }, input: { flex: 1, color: '#152238', fontSize: 14, marginLeft: 8 }, filters: { gap: 9, paddingVertical: 18 }, filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFF' }, activeFilter: { backgroundColor: '#152238' }, filterText: { color: '#687587', fontSize: 12, fontWeight: '700' }, activeFilterText: { color: '#FFF' }, resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, result: { color: '#8490A0', fontSize: 12 }, sort: { flexDirection: 'row', gap: 3, alignItems: 'center' }, sortText: { color: '#536174', fontSize: 12, fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 10, marginBottom: 3 }, image: { height: 145, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' }, heart: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFFAA', alignItems: 'center', justifyContent: 'center' }, category: { color: '#E76F51', fontSize: 10, fontWeight: '800', marginTop: 11, textTransform: 'uppercase' }, name: { color: '#152238', fontSize: 13, fontWeight: '800', marginTop: 4 }, rating: { flexDirection: 'row', alignItems: 'center', marginTop: 7 }, ratingText: { color: '#536174', fontSize: 11, fontWeight: '700', marginLeft: 3 }, dot: { color: '#B2BAC4', fontSize: 11, marginHorizontal: 4 }, reviews: { color: '#9AA5B4', fontSize: 10 }, price: { color: '#E76F51', fontSize: 15, fontWeight: '800', marginTop: 9 } });
