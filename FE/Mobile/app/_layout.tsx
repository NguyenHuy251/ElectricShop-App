import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { shop } from '@/constants/shop-theme';
import { authService } from '@/services/auth.service';
import { isStoredMobileStaff } from '@/utils/mobile-access';
import { ContactReplyNotice } from '@/components/contact-reply-notice';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const routeGroup = segments[0];

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem('token'), AsyncStorage.getItem('user')]).then(async ([token, user]) => {
      if (!active) return;
      if (token && isStoredMobileStaff(user)) {
        await authService.logout();
        if (active) router.replace('/(auth)/login');
        return;
      }
      const inAuthGroup = routeGroup === '(auth)';
      if (!token && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (token && inAuthGroup) {
        router.replace('/(tabs)');
      }
    });

    return () => {
      active = false;
    };
  }, [routeGroup, router]);

  return (
    <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: shop.primary, background: shop.background, card: shop.background, text: shop.ink, border: shop.border } }}>
      <Stack screenOptions={{ headerShadowVisible: false, headerTintColor: shop.ink, headerStyle: { backgroundColor: shop.background }, headerTitleStyle: { fontSize: 16, fontWeight: '700' }, contentStyle: { backgroundColor: shop.background } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Chi tiết sản phẩm' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Chi tiết đơn hàng' }} />
        <Stack.Screen name="checkout" options={{ title: 'Thanh toán' }} />
        <Stack.Screen name="checkout-success" options={{ title: 'Đơn hàng của bạn', headerBackVisible: false }} />
        <Stack.Screen name="account-tools" options={{ title: 'Đổi mật khẩu' }} />
        <Stack.Screen name="vouchers" options={{ title: 'Voucher của tôi', headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="orders" options={{ title: 'Đơn hàng của tôi' }} />
      </Stack>
      {routeGroup !== '(auth)' ? <ContactReplyNotice /> : null}
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
