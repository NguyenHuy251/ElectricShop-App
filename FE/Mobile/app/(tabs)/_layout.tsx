import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { shop } from '@/constants/shop-theme';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: shop.primary,
        tabBarInactiveTintColor: shop.muted,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: shop.border, height: 66 + Math.max(insets.bottom, 10), paddingBottom: Math.max(insets.bottom, 10), paddingTop: 8, elevation: 0 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 3 },
        sceneStyle: { backgroundColor: shop.background },
        headerShown: false,
        tabBarButton: HapticTab as any,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => <View style={{ width: 46, height: 29, borderRadius: 12, backgroundColor: focused ? shop.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons size={22} name="home" color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color, focused }) => <View style={{ width: 46, height: 29, borderRadius: 12, backgroundColor: focused ? shop.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons size={22} name="grid-view" color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: ({ color, focused }) => <View style={{ width: 46, height: 29, borderRadius: 12, backgroundColor: focused ? shop.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons size={22} name="shopping-cart" color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, focused }) => <View style={{ width: 46, height: 29, borderRadius: 12, backgroundColor: focused ? shop.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons size={22} name="receipt" color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => <View style={{ width: 46, height: 29, borderRadius: 12, backgroundColor: focused ? shop.soft : 'transparent', alignItems: 'center', justifyContent: 'center' }}><MaterialIcons size={22} name="person-outline" color={color} /></View>,
        }}
      />
    </Tabs>
  );
}
